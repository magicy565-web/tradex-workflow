"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart, Search, ChevronDown, Loader2, Truck,
  CheckCircle, Package, Clock, XCircle, Eye, X,
} from "lucide-react";
import type { SupplyOrder } from "@/types/supply-chain";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:    { label: "待确认", color: "bg-yellow-50 text-yellow-700", icon: Clock },
  confirmed:  { label: "已确认", color: "bg-blue-50 text-blue-700", icon: CheckCircle },
  processing: { label: "备货中", color: "bg-orange-50 text-orange-700", icon: Package },
  shipped:    { label: "已发货", color: "bg-purple-50 text-purple-700", icon: Truck },
  delivered:  { label: "已签收", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
  cancelled:  { label: "已取消", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

export default function SupplyOrdersPage() {
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SupplyOrder | null>(null);
  const [fulfillModal, setFulfillModal] = useState<SupplyOrder | null>(null);
  const [trackingForm, setTrackingForm] = useState({ tracking_company: "", tracking_number: "", tracking_url: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/supply/orders?${params}`);
    const json = await res.json();
    setOrders(json.data || []);
    setTotal(json.pagination?.total || 0);
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Read initial filter from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status) setFilterStatus(status);
  }, []);

  const handleConfirm = async (id: string) => {
    setActionLoading(true);
    await fetch(`/api/supply/orders/${id}/confirm`, { method: "PUT" });
    setActionLoading(false);
    fetchOrders();
    setSelectedOrder(null);
  };

  const handleFulfill = async () => {
    if (!fulfillModal || !trackingForm.tracking_number) return;
    setActionLoading(true);
    await fetch(`/api/supply/orders/${fulfillModal.id}/fulfill`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trackingForm),
    });
    setActionLoading(false);
    setFulfillModal(null);
    setTrackingForm({ tracking_company: "", tracking_number: "", tracking_url: "" });
    fetchOrders();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">供应链订单</h2>
        <p className="text-sm text-gray-500">管理来自 Shopify 卖家的订单</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-indigo-300"
          >
            <option value="">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="processing">备货中</option>
            <option value="shipped">已发货</option>
            <option value="delivered">已签收</option>
            <option value="cancelled">已取消</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ShoppingCart className="mx-auto mb-2 h-8 w-8" />
            暂无订单
          </div>
        ) : (
          orders.map((order) => {
            const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = sc.icon;
            const addr = order.shipping_address;
            return (
              <div
                key={order.id}
                className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Order Info */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <StatusIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {order.order_number}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {(order.product as any)?.title || "产品"} x{order.quantity}
                      </p>
                      <p className="text-xs text-gray-400">
                        卖家: {(order.seller as any)?.shop_domain || "—"} &middot;
                        {order.shopify_order_name && ` Shopify ${order.shopify_order_name} · `}
                        {new Date(order.created_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-gray-900">
                        ${Number(order.total_cost).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        ${Number(order.unit_cost).toFixed(2)} x {order.quantity}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleConfirm(order.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          确认
                        </button>
                      )}
                      {["confirmed", "processing"].includes(order.status) && (
                        <button
                          onClick={() => {
                            setFulfillModal(order);
                            setTrackingForm({ tracking_company: "", tracking_number: "", tracking_url: "" });
                          }}
                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
                        >
                          发货
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shipping Address Preview */}
                {addr && (
                  <p className="mt-2 text-xs text-gray-400">
                    收件: {addr.name}, {addr.city}, {addr.province}, {addr.country} {addr.zip}
                  </p>
                )}

                {/* Tracking Info */}
                {order.tracking_number && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5 text-xs text-purple-700">
                    <Truck className="h-3.5 w-3.5" />
                    {order.tracking_company && `${order.tracking_company}: `}
                    {order.tracking_number}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">共 {total} 个订单</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border px-3 py-1 text-xs disabled:opacity-40">上一页</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-md border px-3 py-1 text-xs disabled:opacity-40">下一页</button>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">填写物流信息</h3>
              <button onClick={() => setFulfillModal(null)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              订单 {fulfillModal.order_number}，填写发货信息后将通知卖家。
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">物流公司</label>
                <input
                  type="text"
                  value={trackingForm.tracking_company}
                  onChange={(e) => setTrackingForm({ ...trackingForm, tracking_company: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
                  placeholder="e.g. YTO Express, DHL, FedEx"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  物流单号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingForm.tracking_number}
                  onChange={(e) => setTrackingForm({ ...trackingForm, tracking_number: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
                  placeholder="物流追踪号码"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">追踪链接</label>
                <input
                  type="text"
                  value={trackingForm.tracking_url}
                  onChange={(e) => setTrackingForm({ ...trackingForm, tracking_url: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setFulfillModal(null)} className="rounded-lg border px-4 py-2 text-sm">取消</button>
              <button
                onClick={handleFulfill}
                disabled={!trackingForm.tracking_number || actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                确认发货
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">订单详情</h3>
              <button onClick={() => setSelectedOrder(null)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4 p-6 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-400">订单号</span><p className="font-mono font-semibold">{selectedOrder.order_number}</p></div>
                <div><span className="text-gray-400">状态</span><p className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[selectedOrder.status]?.color}`}>{STATUS_CONFIG[selectedOrder.status]?.label}</p></div>
                <div><span className="text-gray-400">产品</span><p>{(selectedOrder.product as any)?.title}</p></div>
                <div><span className="text-gray-400">数量</span><p>{selectedOrder.quantity}</p></div>
                <div><span className="text-gray-400">单价</span><p className="font-mono">${Number(selectedOrder.unit_cost).toFixed(2)}</p></div>
                <div><span className="text-gray-400">总额</span><p className="font-mono font-bold">${Number(selectedOrder.total_cost).toFixed(2)}</p></div>
                <div><span className="text-gray-400">卖家</span><p>{(selectedOrder.seller as any)?.shop_domain}</p></div>
                <div><span className="text-gray-400">Shopify 订单</span><p>{selectedOrder.shopify_order_name || "—"}</p></div>
              </div>
              {selectedOrder.shipping_address && (
                <div className="border-t pt-3">
                  <p className="mb-1 font-medium text-gray-700">收货地址</p>
                  <p className="text-gray-600">
                    {selectedOrder.shipping_address.name}<br />
                    {selectedOrder.shipping_address.address1}<br />
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.province} {selectedOrder.shipping_address.zip}<br />
                    {selectedOrder.shipping_address.country}
                    {selectedOrder.shipping_address.phone && <><br />{selectedOrder.shipping_address.phone}</>}
                  </p>
                </div>
              )}
              {selectedOrder.tracking_number && (
                <div className="border-t pt-3">
                  <p className="mb-1 font-medium text-gray-700">物流信息</p>
                  <p className="text-gray-600">
                    {selectedOrder.tracking_company && `${selectedOrder.tracking_company}: `}
                    {selectedOrder.tracking_number}
                  </p>
                </div>
              )}
              <div className="border-t pt-3 text-xs text-gray-400">
                创建时间: {new Date(selectedOrder.created_at).toLocaleString("zh-CN")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
