"use client";

import { useEffect, useState } from "react";
import {
  Users, Store, ShoppingCart, Package, Clock,
  ChevronDown, Loader2, ExternalLink, Mail, Search,
  Shield, X,
} from "lucide-react";

interface Subscriber {
  id: string;
  status: string;
  created_at: string;
  markup_type: string;
  markup_value: number;
  seller: {
    id: string;
    shop_domain: string;
    shop_name: string | null;
    email: string | null;
  };
  product: {
    id: string;
    title: string;
    title_zh: string | null;
  };
}

type ApprovalStatus = "auto_approved" | "approved" | "pending" | "suspended";
type SellerTier = "standard" | "silver" | "gold" | "vip";

interface SellerMeta {
  approval_status: ApprovalStatus;
  tier: SellerTier;
  commission_rate: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:  { label: "活跃", color: "bg-emerald-50 text-emerald-700" },
  paused:  { label: "暂停", color: "bg-yellow-50 text-yellow-700" },
  removed: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

const APPROVAL_MAP: Record<ApprovalStatus, { label: string; color: string }> = {
  auto_approved: { label: "自动批准", color: "bg-emerald-50 text-emerald-700" },
  approved:      { label: "已批准",   color: "bg-blue-50 text-blue-700" },
  pending:       { label: "待审核",   color: "bg-yellow-50 text-yellow-700" },
  suspended:     { label: "已暂停",   color: "bg-red-50 text-red-700" },
};

const TIER_MAP: Record<SellerTier, { label: string; color: string }> = {
  standard: { label: "Standard", color: "bg-gray-100 text-gray-600" },
  silver:   { label: "Silver",   color: "bg-slate-100 text-slate-600" },
  gold:     { label: "Gold",     color: "bg-amber-50 text-amber-700" },
  vip:      { label: "VIP",      color: "bg-violet-50 text-violet-700" },
};

type FilterTab = "all" | "pending" | "approved" | "suspended";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",       label: "全部" },
  { key: "pending",   label: "待审核" },
  { key: "approved",  label: "已批准" },
  { key: "suspended", label: "已暂停" },
];

const DEFAULT_META: SellerMeta = { approval_status: "auto_approved", tier: "standard", commission_rate: 5 };

export default function SupplySellersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerSearch, setSellerSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sellerMetas, setSellerMetas] = useState<Record<string, SellerMeta>>({});

  // Approve modal state
  const [approveModal, setApproveModal] = useState<{ sellerId: string } | null>(null);
  const [approveTier, setApproveTier] = useState<SellerTier>("standard");
  const [approveCommission, setApproveCommission] = useState("5");
  const [approveLoading, setApproveLoading] = useState(false);

  // Suspend modal state
  const [suspendModal, setSuspendModal] = useState<{ sellerId: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  useEffect(() => {
    fetch("/api/supply/subscribers")
      .then((r) => r.json())
      .then((json) => {
        setSubscribers(json.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getMeta = (id: string): SellerMeta => sellerMetas[id] || DEFAULT_META;

  const callApproveApi = async (sellerId: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/supply/sellers/${sellerId}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    setApproveLoading(true);
    const rate = parseFloat(approveCommission) || 5;
    const ok = await callApproveApi(approveModal.sellerId, {
      action: "approve", tier: approveTier, commission_rate: rate,
    });
    if (ok) {
      setSellerMetas((prev) => ({
        ...prev,
        [approveModal.sellerId]: { approval_status: "approved", tier: approveTier, commission_rate: rate },
      }));
    }
    setApproveLoading(false);
    setApproveModal(null);
  };

  const handleReject = async (sellerId: string) => {
    await callApproveApi(sellerId, { action: "suspend", suspend_reason: "申请被拒绝" });
    setSellerMetas((prev) => ({
      ...prev,
      [sellerId]: { ...getMeta(sellerId), approval_status: "suspended" },
    }));
  };

  const handleSuspend = async () => {
    if (!suspendModal) return;
    setSuspendLoading(true);
    const ok = await callApproveApi(suspendModal.sellerId, {
      action: "suspend", suspend_reason: suspendReason,
    });
    if (ok) {
      setSellerMetas((prev) => ({
        ...prev,
        [suspendModal.sellerId]: { ...getMeta(suspendModal.sellerId), approval_status: "suspended" },
      }));
    }
    setSuspendLoading(false);
    setSuspendModal(null);
    setSuspendReason("");
  };

  const handleReactivate = async (sellerId: string) => {
    const ok = await callApproveApi(sellerId, { action: "approve", tier: getMeta(sellerId).tier, commission_rate: getMeta(sellerId).commission_rate });
    if (ok) {
      setSellerMetas((prev) => ({
        ...prev,
        [sellerId]: { ...getMeta(sellerId), approval_status: "approved" },
      }));
    }
  };

  // Group by seller
  const sellerMap = new Map<
    string,
    { seller: Subscriber["seller"]; subscriptions: Subscriber[]; activeCount: number }
  >();

  for (const sub of subscribers) {
    const key = sub.seller.id;
    if (!sellerMap.has(key)) {
      sellerMap.set(key, { seller: sub.seller, subscriptions: [], activeCount: 0 });
    }
    const entry = sellerMap.get(key)!;
    entry.subscriptions.push(sub);
    if (sub.status === "active") entry.activeCount++;
  }

  const sellers = Array.from(sellerMap.values()).sort(
    (a, b) => b.activeCount - a.activeCount
  );

  const filteredSellers = sellers.filter(({ seller }) => {
    const meta = getMeta(seller.id);
    if (filterTab === "pending" && meta.approval_status !== "pending") return false;
    if (filterTab === "approved" && meta.approval_status !== "approved" && meta.approval_status !== "auto_approved") return false;
    if (filterTab === "suspended" && meta.approval_status !== "suspended") return false;
    if (sellerSearch) {
      const q = sellerSearch.toLowerCase();
      if (!seller.shop_domain.toLowerCase().includes(q) && !(seller.shop_name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">卖家管理</h2>
        <p className="text-sm text-gray-500">查看订阅你产品的 Shopify 卖家</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Store className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{sellers.length}</p>
              <p className="text-xs text-gray-500">卖家总数</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {subscribers.filter((s) => s.status === "active").length}
              </p>
              <p className="text-xs text-gray-500">活跃订阅</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{subscribers.length}</p>
              <p className="text-xs text-gray-500">总订阅数</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filterTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索卖家名称或域名..."
          value={sellerSearch}
          onChange={(e) => setSellerSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Seller List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users className="mx-auto mb-2 h-8 w-8" />
          <p>暂无卖家订阅你的产品</p>
          <p className="mt-1 text-xs">当 Shopify 卖家通过 App 订阅你的产品后，他们将出现在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSellers.map(({ seller, subscriptions, activeCount }) => {
            const meta = getMeta(seller.id);
            const approval = APPROVAL_MAP[meta.approval_status];
            const tier = TIER_MAP[meta.tier];
            return (
              <div key={seller.id} className="rounded-xl border border-black/[0.06] bg-white shadow-sm transition-all hover:shadow-md">
                {/* Seller Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {seller.shop_name || seller.shop_domain.split(".")[0]}
                        </p>
                        <a href={`https://${seller.shop_domain}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${approval.color}`}>{approval.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tier.color}`}>{tier.label}</span>
                        <span className="text-[11px] text-gray-500">佣金 {meta.commission_rate}%</span>
                      </div>
                      <p className="text-xs text-gray-400">{seller.shop_domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {seller.email && (
                      <a href={`mailto:${seller.email}`} className="flex items-center gap-1 text-gray-400 hover:text-gray-600">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="hidden text-xs sm:inline">{seller.email}</span>
                      </a>
                    )}
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {activeCount} 个活跃订阅
                    </span>
                    {/* Action buttons */}
                    {meta.approval_status === "pending" && (
                      <>
                        <button onClick={() => { setApproveTier("standard"); setApproveCommission("5"); setApproveModal({ sellerId: seller.id }); }}
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                          批准
                        </button>
                        <button onClick={() => handleReject(seller.id)}
                          className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
                          拒绝
                        </button>
                      </>
                    )}
                    {(meta.approval_status === "approved" || meta.approval_status === "auto_approved") && (
                      <button onClick={() => { setSuspendReason(""); setSuspendModal({ sellerId: seller.id }); }}
                        className="rounded-md bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100 transition-colors">
                        暂停
                      </button>
                    )}
                    {meta.approval_status === "suspended" && (
                      <button onClick={() => handleReactivate(seller.id)}
                        className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                        恢复
                      </button>
                    )}
                  </div>
                </div>

                {/* Subscriptions */}
                <div className="divide-y divide-gray-50">
                  {subscriptions.map((sub) => {
                    const st = STATUS_MAP[sub.status] || STATUS_MAP.active;
                    return (
                      <div key={sub.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{sub.product.title}</span>
                          {sub.product.title_zh && (
                            <span className="text-xs text-gray-400">({sub.product.title_zh})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            加价 {sub.markup_type === "percentage" ? `${sub.markup_value}%` : `$${sub.markup_value}`}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.color}`}>{st.label}</span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(sub.created_at).toLocaleDateString("zh-CN")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">批准卖家</h3>
              <button onClick={() => setApproveModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">卖家等级</label>
                <select value={approveTier} onChange={(e) => setApproveTier(e.target.value as SellerTier)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100">
                  <option value="standard">Standard</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">佣金比例 (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={approveCommission}
                  onChange={(e) => setApproveCommission(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <button onClick={handleApprove} disabled={approveLoading}
                className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {approveLoading ? "处理中..." : "确认批准"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">暂停卖家</h3>
              <button onClick={() => setSuspendModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">暂停原因</label>
                <input type="text" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="请输入暂停原因..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <button onClick={handleSuspend} disabled={suspendLoading || !suspendReason.trim()}
                className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {suspendLoading ? "处理中..." : "确认暂停"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
