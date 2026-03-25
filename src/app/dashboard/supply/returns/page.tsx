"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RotateCcw, Search, Loader2, Eye, X, Check, XCircle,
  Package, Truck, DollarSign, Clock, Image, ChevronDown,
} from "lucide-react";
import type { SupplyReturn } from "@/types/supply-chain";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  requested:    { label: "待处理", color: "bg-yellow-50 text-yellow-700", icon: Clock },
  approved:     { label: "已批准", color: "bg-blue-50 text-blue-700", icon: Check },
  rejected:     { label: "已拒绝", color: "bg-gray-100 text-gray-500", icon: XCircle },
  shipped_back: { label: "退货中", color: "bg-purple-50 text-purple-700", icon: Truck },
  received:     { label: "已收货", color: "bg-orange-50 text-orange-700", icon: Package },
  refunded:     { label: "已退款", color: "bg-emerald-50 text-emerald-700", icon: DollarSign },
  cancelled:    { label: "已取消", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  refund_only: "仅退款",
  return_refund: "退货退款",
  exchange: "换货",
};

const TYPE_COLORS: Record<string, string> = {
  refund_only: "bg-amber-50 text-amber-700",
  return_refund: "bg-indigo-50 text-indigo-700",
  exchange: "bg-teal-50 text-teal-700",
};

export default function SupplyReturnsPage() {
  const [returns, setReturns] = useState<SupplyReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<SupplyReturn | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/supply/returns?${params}`);
    const json = await res.json();
    setReturns(json.data || []);
    setTotal(json.pagination?.total || 0);
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status) setFilterStatus(status);
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    await fetch(`/api/supply/returns/${id}/approve`, { method: "PUT" });
    setActionLoading(false);
    setSelectedReturn(null);
    fetchReturns();
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    await fetch(`/api/supply/returns/${id}/reject`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reject_reason: rejectReason }),
    });
    setActionLoading(false);
    setRejectReason("");
    setShowRejectInput(false);
    setSelectedReturn(null);
    fetchReturns();
  };

  const handleRefund = async (id: string) => {
    setActionLoading(true);
    await fetch(`/api/supply/returns/${id}/refund`, { method: "PUT" });
    setActionLoading(false);
    setSelectedReturn(null);
    fetchReturns();
  };

  const filtered = returns.filter((r) => !searchQuery || r.return_number.toLowerCase().includes(searchQuery.toLowerCase()));
  const counts = {
    total: returns.length, requested: returns.filter((r) => r.status === "requested").length,
    processing: returns.filter((r) => ["approved", "shipped_back"].includes(r.status)).length,
    refunded: returns.filter((r) => r.status === "refunded").length,
  };
  const totalPages = Math.ceil(total / 20);
  const canRefund = (r: SupplyReturn) => r.status === "received" || (r.status === "approved" && r.type === "refund_only");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">退货/退款管理</h2>
        <p className="text-sm text-gray-500">处理卖家提交的退货退款申请</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "总退货", value: counts.total, icon: RotateCcw, bg: "bg-gray-50" },
          { label: "待处理", value: counts.requested, icon: Clock, bg: "bg-yellow-50" },
          { label: "处理中", value: counts.processing, icon: Package, bg: "bg-blue-50" },
          { label: "已退款", value: counts.refunded, icon: DollarSign, bg: "bg-emerald-50" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl border border-black/[0.06] ${card.bg} p-4 shadow-sm`}>
            <div className="flex items-center gap-2">
              <card.icon className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {[
            { value: "", label: "全部" },
            { value: "requested", label: "待处理" },
            { value: "approved", label: "已批准" },
            { value: "rejected", label: "已拒绝" },
            { value: "shipped_back", label: "退货中" },
            { value: "received", label: "已收货" },
            { value: "refunded", label: "已退款" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilterStatus(tab.value); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === tab.value
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索退货号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Return List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <RotateCcw className="mx-auto mb-2 h-8 w-8" />
            暂无退货记录
          </div>
        ) : (
          filtered.map((ret) => {
            const sc = STATUS_CONFIG[ret.status] || STATUS_CONFIG.requested;
            const StatusIcon = sc.icon;
            return (
              <div
                key={ret.id}
                className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <StatusIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {ret.return_number}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>
                          {sc.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[ret.type]}`}>
                          {TYPE_LABELS[ret.type]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {(ret.product as any)?.title || "产品"} x{ret.quantity}
                      </p>
                      <p className="text-xs text-gray-400">
                        订单: {(ret.order as any)?.order_number || "—"} &middot;
                        卖家: {(ret.seller as any)?.shop_name || (ret.seller as any)?.shop_domain || "—"} &middot;
                        {new Date(ret.created_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-gray-900">
                        ¥{Number(ret.refund_amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">退款金额</p>
                    </div>
                    <div className="flex gap-1">
                      {ret.status === "requested" && (
                        <button
                          onClick={() => handleApprove(ret.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          批准
                        </button>
                      )}
                      {canRefund(ret) && (
                        <button
                          onClick={() => handleRefund(ret.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          确认退款
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedReturn(ret); setShowRejectInput(false); setRejectReason(""); }}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">共 {total} 条退货记录</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40">上一页</button>
            <span className="px-2 text-xs text-gray-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40">下一页</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">退货详情</h3>
              <button onClick={() => { setSelectedReturn(null); setShowRejectInput(false); }} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4 p-6 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-400">退货号</span><p className="font-mono font-semibold">{selectedReturn.return_number}</p></div>
                <div><span className="text-gray-400">状态</span><p className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[selectedReturn.status]?.color}`}>{STATUS_CONFIG[selectedReturn.status]?.label}</p></div>
                <div><span className="text-gray-400">类型</span><p className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[selectedReturn.type]}`}>{TYPE_LABELS[selectedReturn.type]}</p></div>
                <div><span className="text-gray-400">退款金额</span><p className="font-mono font-bold">¥{Number(selectedReturn.refund_amount).toFixed(2)}</p></div>
                <div><span className="text-gray-400">产品</span><p>{(selectedReturn.product as any)?.title || "—"}</p></div>
                <div><span className="text-gray-400">数量</span><p>{selectedReturn.quantity}</p></div>
                <div><span className="text-gray-400">关联订单</span><p className="font-mono">{(selectedReturn.order as any)?.order_number || "—"}</p></div>
                <div><span className="text-gray-400">卖家</span><p>{(selectedReturn.seller as any)?.shop_name || (selectedReturn.seller as any)?.shop_domain || "—"}</p></div>
              </div>

              {/* Reason */}
              <div className="border-t pt-3">
                <p className="mb-1 font-medium text-gray-700">退货原因</p>
                <p className="text-gray-600">{selectedReturn.reason}</p>
                {selectedReturn.description && (
                  <p className="mt-1 text-gray-500">{selectedReturn.description}</p>
                )}
              </div>

              {/* Evidence Images */}
              {selectedReturn.evidence_images && selectedReturn.evidence_images.length > 0 && (
                <div className="border-t pt-3">
                  <p className="mb-2 flex items-center gap-1.5 font-medium text-gray-700">
                    <Image className="h-4 w-4" /> 凭证图片
                  </p>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedReturn.evidence_images.map((img, i) => (
                      <img key={i} src={img} alt={`凭证 ${i + 1}`} className="h-20 w-20 shrink-0 rounded-lg border object-cover" />
                    ))}
                  </div>
                </div>
              )}

              {selectedReturn.reject_reason && (
                <div className="border-t pt-3">
                  <p className="mb-1 font-medium text-gray-700">拒绝原因</p>
                  <p className="text-gray-600">{selectedReturn.reject_reason}</p>
                </div>
              )}
              {selectedReturn.type === "return_refund" && ["shipped_back", "received", "refunded"].includes(selectedReturn.status) && (
                <div className="border-t pt-3">
                  <p className="mb-1 flex items-center gap-1.5 font-medium text-gray-700"><Truck className="h-4 w-4" /> 退货物流</p>
                  <p className="text-gray-600">{selectedReturn.notes || "物流信息待更新"}</p>
                </div>
              )}
              {selectedReturn.refunded_at && (
                <div className="border-t pt-3 text-xs text-gray-400">退款时间: {new Date(selectedReturn.refunded_at).toLocaleString("zh-CN")}</div>
              )}
              <div className="border-t pt-3 text-xs text-gray-400">创建时间: {new Date(selectedReturn.created_at).toLocaleString("zh-CN")}</div>

              {/* Actions */}
              {selectedReturn.status === "requested" && (
                <div className="space-y-3 border-t pt-3">
                  {showRejectInput ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="请输入拒绝原因..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(selectedReturn.id)}
                          disabled={!rejectReason.trim() || actionLoading}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-600 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                          {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                          确认拒绝
                        </button>
                        <button
                          onClick={() => setShowRejectInput(false)}
                          className="rounded-lg border px-4 py-2 text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(selectedReturn.id)}
                        disabled={actionLoading}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        批准
                      </button>
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              )}

              {canRefund(selectedReturn) && (
                <div className="border-t pt-3">
                  <button
                    onClick={() => handleRefund(selectedReturn.id)}
                    disabled={actionLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    确认退款
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
