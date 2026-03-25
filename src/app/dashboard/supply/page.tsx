"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package, ShoppingCart, Users, DollarSign, ArrowRight,
  Clock, TrendingUp, AlertCircle, Store, BarChart3, RotateCcw, Settings,
} from "lucide-react";
import type { SupplyOrder } from "@/types/supply-chain";

interface Stats {
  total_products: number;
  active_products: number;
  total_subscribers: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
}

/* ---- Order status donut (SVG) ---- */
function StatusDonut({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const colors: Record<string, string> = {
    pending: "#f59e0b", confirmed: "#3b82f6", processing: "#f97316",
    shipped: "#8b5cf6", delivered: "#10b981", cancelled: "#9ca3af",
  };
  const labels: Record<string, string> = {
    pending: "待确认", confirmed: "已确认", processing: "备货中",
    shipped: "已发货", delivered: "已签收", cancelled: "已取消",
  };

  let cumulative = 0;
  const segments = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => {
      const start = cumulative;
      cumulative += count / total;
      return { status, count, start, end: cumulative, color: colors[status] || "#9ca3af" };
    });

  const r = 40, cx = 50, cy = 50;

  function describeArc(startAngle: number, endAngle: number) {
    const s = startAngle * 2 * Math.PI - Math.PI / 2;
    const e = endAngle * 2 * Math.PI - Math.PI / 2;
    const largeArc = endAngle - startAngle > 0.5 ? 1 : 0;
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${largeArc} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0">
        {segments.length === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
        ) : segments.length === 1 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={segments[0].color} strokeWidth={10} />
        ) : (
          segments.map((seg) => (
            <path key={seg.status} d={describeArc(seg.start, seg.end - 0.005)} fill="none" stroke={seg.color} strokeWidth={10} strokeLinecap="round" />
          ))
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-[18px] font-bold fill-gray-900">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="text-[8px] fill-gray-400">总订单</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-xs text-gray-500">{labels[seg.status]} ({seg.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupplyDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/supply/stats").then((r) => r.json()),
      fetch("/api/supply/orders?limit=5").then((r) => r.json()),
    ]).then(([statsData, ordersData]) => {
      setStats(statsData);
      setRecentOrders(ordersData.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Calculate order status distribution from all orders
  const statusCounts: Record<string, number> = {};
  for (const o of recentOrders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  const statCards = stats ? [
    { label: "上架产品", value: stats.active_products, sub: `${stats.total_products} 总计`, icon: Package, color: "text-blue-600 bg-blue-50", href: "/dashboard/supply/products" },
    { label: "卖家订阅", value: stats.total_subscribers, sub: "活跃订阅", icon: Users, color: "text-emerald-600 bg-emerald-50", href: "/dashboard/supply/sellers" },
    { label: "供应链订单", value: stats.total_orders, sub: `${stats.pending_orders} 待处理`, icon: ShoppingCart, color: "text-orange-600 bg-orange-50", href: "/dashboard/supply/orders" },
    { label: "总收入", value: `$${stats.total_revenue.toLocaleString()}`, sub: "USD", icon: DollarSign, color: "text-violet-600 bg-violet-50", href: "/dashboard/supply/orders" },
  ] : [];

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "待确认", color: "bg-yellow-50 text-yellow-700" },
    confirmed: { label: "已确认", color: "bg-blue-50 text-blue-700" },
    processing: { label: "备货中", color: "bg-orange-50 text-orange-700" },
    shipped: { label: "已发货", color: "bg-purple-50 text-purple-700" },
    delivered: { label: "已签收", color: "bg-emerald-50 text-emerald-700" },
    cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">供应链概览</h2>
          <p className="mt-1 text-sm text-gray-500">管理你的供应链产品、订阅和订单</p>
        </div>
        <Link href="/dashboard/supply/products" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
          <Package className="h-4 w-4" /> 管理产品
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (<div key={i} className="h-32 animate-pulse rounded-xl border border-black/[0.06] bg-white" />))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href} className="group rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}><Icon className="h-5 w-5" /></div>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" />
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">{card.value}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Charts Row */}
      {!loading && stats && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Order Status Distribution */}
          <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900">订单状态分布</h3>
            </div>
            {Object.keys(statusCounts).length > 0 ? (
              <StatusDonut counts={statusCounts} />
            ) : (
              <p className="py-6 text-center text-sm text-gray-400">暂无订单数据</p>
            )}
          </div>

          {/* Business Metrics */}
          <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900">业务概况</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">产品上架率</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${stats.total_products > 0 ? (stats.active_products / stats.total_products) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{stats.total_products > 0 ? Math.round((stats.active_products / stats.total_products) * 100) : 0}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">订单处理率</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.total_orders > 0 ? ((stats.total_orders - stats.pending_orders) / stats.total_orders) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{stats.total_orders > 0 ? Math.round(((stats.total_orders - stats.pending_orders) / stats.total_orders) * 100) : 0}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">平均订单价值</span>
                <span className="font-mono text-sm font-medium text-gray-700">${stats.total_orders > 0 ? (stats.total_revenue / stats.total_orders).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">订阅/产品比</span>
                <span className="text-sm font-medium text-gray-700">{stats.active_products > 0 ? (stats.total_subscribers / stats.active_products).toFixed(1) : "0"} 卖家/产品</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts + Quick Actions + Recent Orders */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Pending Orders Alert */}
        {stats && stats.pending_orders > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">{stats.pending_orders} 个订单待处理</h3>
            </div>
            <p className="mt-2 text-sm text-orange-700">你有新的供应链订单需要确认和处理，请尽快查看。</p>
            <Link href="/dashboard/supply/orders?status=pending" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900">
              查看待处理订单 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Quick Links */}
        <div className="rounded-xl border border-black/[0.06] bg-white p-5">
          <h3 className="font-semibold text-gray-900">快捷操作</h3>
          <div className="mt-3 space-y-2">
            <Link href="/dashboard/supply/products?action=new" className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              <Package className="h-4 w-4 text-blue-500" /> 上架新产品到供应链
            </Link>
            <Link href="/dashboard/supply/orders" className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              <Clock className="h-4 w-4 text-orange-500" /> 查看所有订单
            </Link>
            <Link href="/dashboard/supply/sellers" className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              <Store className="h-4 w-4 text-indigo-500" /> 管理卖家
            </Link>
            <Link href="/dashboard/supply/products" className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> 查看产品订阅数据
            </Link>
            <Link href="/dashboard/supply/analytics" className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              <BarChart3 className="h-4 w-4 text-violet-500" /> 数据分析
            </Link>
            <Link href="/dashboard/supply/returns" className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              <RotateCcw className="h-4 w-4 text-red-500" /> 退货售后
            </Link>
            <Link href="/dashboard/supply/settings" className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              <Settings className="h-4 w-4 text-gray-500" /> 供应链设置
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl border border-black/[0.06] bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">最近订单</h3>
            <Link href="/dashboard/supply/orders" className="text-xs text-indigo-600 hover:text-indigo-700">查看全部</Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentOrders.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">暂无订单</p>
            ) : (
              recentOrders.slice(0, 5).map((order) => {
                const sl = statusLabels[order.status] || statusLabels.pending;
                return (
                  <div key={order.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{order.order_number}</p>
                      <p className="text-[11px] text-gray-400">{new Date(order.created_at).toLocaleDateString("zh-CN")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-gray-700">${Number(order.total_cost).toFixed(0)}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${sl.color}`}>{sl.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
