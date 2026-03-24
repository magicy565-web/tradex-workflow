"use client";

import { useEffect, useState } from "react";
import {
  Users, Store, ShoppingCart, Package, Clock,
  ChevronDown, Loader2, ExternalLink, Mail,
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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:  { label: "活跃", color: "bg-emerald-50 text-emerald-700" },
  paused:  { label: "暂停", color: "bg-yellow-50 text-yellow-700" },
  removed: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

export default function SupplySellersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/supply/subscribers")
      .then((r) => r.json())
      .then((json) => {
        setSubscribers(json.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group by seller
  const sellerMap = new Map<
    string,
    {
      seller: Subscriber["seller"];
      subscriptions: Subscriber[];
      activeCount: number;
    }
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">卖家管理</h2>
        <p className="text-sm text-gray-500">
          查看订阅你产品的 Shopify 卖家
        </p>
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

      {/* Seller List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users className="mx-auto mb-2 h-8 w-8" />
          <p>暂无卖家订阅你的产品</p>
          <p className="mt-1 text-xs">
            当 Shopify 卖家通过 App 订阅你的产品后，他们将出现在这里
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map(({ seller, subscriptions, activeCount }) => (
            <div
              key={seller.id}
              className="rounded-xl border border-black/[0.06] bg-white shadow-sm transition-all hover:shadow-md"
            >
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
                      <a
                        href={`https://${seller.shop_domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-indigo-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-400">{seller.shop_domain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {seller.email && (
                    <a
                      href={`mailto:${seller.email}`}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-600"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="hidden text-xs sm:inline">{seller.email}</span>
                    </a>
                  )}
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {activeCount} 个活跃订阅
                  </span>
                </div>
              </div>

              {/* Subscriptions */}
              <div className="divide-y divide-gray-50">
                {subscriptions.map((sub) => {
                  const st = STATUS_MAP[sub.status] || STATUS_MAP.active;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {sub.product.title}
                        </span>
                        {sub.product.title_zh && (
                          <span className="text-xs text-gray-400">
                            ({sub.product.title_zh})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          加价 {sub.markup_type === "percentage" ? `${sub.markup_value}%` : `$${sub.markup_value}`}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.color}`}
                        >
                          {st.label}
                        </span>
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
          ))}
        </div>
      )}
    </div>
  );
}
