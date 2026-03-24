"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3, TrendingUp, DollarSign, Package, Users,
  AlertTriangle, ArrowRight, Loader2, ShoppingCart, CalendarDays,
} from "lucide-react";

interface Analytics {
  period_days: number;
  summary: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    new_subscriptions: number;
    active_products: number;
    low_stock_count: number;
  };
  order_trend: { date: string; count: number; revenue: number }[];
  status_distribution: Record<string, number>;
  top_products: {
    id: string; title: string; title_zh: string | null;
    subscribers: number; orders_period: number;
    revenue_period: number; stock: number; status: string;
  }[];
  low_stock_products: { id: string; title: string; stock: number }[];
  unique_sellers: number;
}

/* ---- Sparkline Bar Chart (pure SVG) ---- */
function BarChartSVG({ data, color = "#6366f1", height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  if (!data.length) return <p className="py-8 text-center text-sm text-gray-400">暂无数据</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100;
  const barW = Math.max(w / data.length - 1, 0.5);
  const gap = data.length > 1 ? (w - barW * data.length) / (data.length - 1) : 0;

  return (
    <svg viewBox={`0 0 ${w} ${height / 4}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.value / max) * (height / 4 - 2);
        const x = i * (barW + gap);
        return (
          <g key={i}>
            <rect x={x} y={height / 4 - h - 1} width={barW} height={Math.max(h, 0.3)} rx={0.4} fill={color} opacity={0.7 + (i / data.length) * 0.3} />
          </g>
        );
      })}
    </svg>
  );
}

export default function SupplyAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/supply/analytics?days=${days}`)
      .then((r) => r.json())
      .then((data) => { setAnalytics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!analytics) {
    return <p className="py-20 text-center text-gray-400">无法加载分析数据</p>;
  }

  const { summary, order_trend, status_distribution, top_products, low_stock_products } = analytics;

  const statusLabels: Record<string, string> = {
    pending: "待确认", confirmed: "已确认", processing: "备货中",
    shipped: "已发货", delivered: "已签收", cancelled: "已取消",
  };
  const statusColors: Record<string, string> = {
    pending: "#f59e0b", confirmed: "#3b82f6", processing: "#f97316",
    shipped: "#8b5cf6", delivered: "#10b981", cancelled: "#9ca3af",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">数据分析</h2>
          <p className="text-sm text-gray-500">供应链业务数据洞察</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                days === d ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { label: "订单量", value: summary.total_orders, icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
          { label: "收入", value: `$${summary.total_revenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
          { label: "平均客单价", value: `$${summary.avg_order_value.toFixed(0)}`, icon: TrendingUp, color: "text-violet-600 bg-violet-50" },
          { label: "新订阅", value: summary.new_subscriptions, icon: Users, color: "text-orange-600 bg-orange-50" },
          { label: "活跃产品", value: summary.active_products, icon: Package, color: "text-indigo-600 bg-indigo-50" },
          { label: "库存预警", value: summary.low_stock_count, icon: AlertTriangle, color: summary.low_stock_count > 0 ? "text-red-600 bg-red-50" : "text-gray-500 bg-gray-50" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm">
              <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Order Trend */}
        <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <h3 className="mb-1 font-semibold text-gray-900">订单趋势</h3>
          <p className="mb-4 text-xs text-gray-400">最近 {days} 天每日订单量</p>
          <BarChartSVG
            data={order_trend.map((d) => ({ label: d.date, value: d.count }))}
            color="#6366f1"
            height={140}
          />
          <div className="mt-2 flex justify-between text-[10px] text-gray-400">
            <span>{order_trend[0]?.date.slice(5)}</span>
            <span>{order_trend[order_trend.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <h3 className="mb-1 font-semibold text-gray-900">收入趋势</h3>
          <p className="mb-4 text-xs text-gray-400">最近 {days} 天每日收入 (USD)</p>
          <BarChartSVG
            data={order_trend.map((d) => ({ label: d.date, value: d.revenue }))}
            color="#10b981"
            height={140}
          />
          <div className="mt-2 flex justify-between text-[10px] text-gray-400">
            <span>{order_trend[0]?.date.slice(5)}</span>
            <span>{order_trend[order_trend.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      </div>

      {/* Status Distribution + Top Products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Status Distribution */}
        <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">订单状态分布</h3>
          {Object.keys(status_distribution).length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(status_distribution)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const total = Object.values(status_distribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: statusColors[status] || "#9ca3af" }} />
                      <span className="min-w-[48px] text-sm text-gray-600">{statusLabels[status] || status}</span>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: statusColors[status] || "#9ca3af" }} />
                        </div>
                      </div>
                      <span className="min-w-[40px] text-right text-sm font-medium text-gray-700">{count}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2 rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">热门产品</h3>
            <Link href="/dashboard/supply/products" className="text-xs text-indigo-600 hover:text-indigo-700">
              查看全部 <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          {top_products.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">暂无产品数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                    <th className="pb-2 font-medium">产品</th>
                    <th className="pb-2 text-right font-medium">订单量</th>
                    <th className="pb-2 text-right font-medium">收入</th>
                    <th className="pb-2 text-center font-medium">订阅</th>
                    <th className="pb-2 text-center font-medium">库存</th>
                  </tr>
                </thead>
                <tbody>
                  {top_products.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-400">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800">{p.title}</p>
                            {p.title_zh && <p className="truncate text-[11px] text-gray-400">{p.title_zh}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono text-gray-700">{p.orders_period}</td>
                      <td className="py-2.5 text-right font-mono font-medium text-gray-900">${p.revenue_period.toLocaleString()}</td>
                      <td className="py-2.5 text-center text-gray-600">{p.subscribers}</td>
                      <td className="py-2.5 text-center">
                        <span className={p.stock < 10 ? "font-medium text-red-600" : "text-gray-600"}>
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {low_stock_products.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">库存预警 ({low_stock_products.length} 个产品)</h3>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {low_stock_products.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                <span className="truncate text-sm text-red-800">{p.title}</span>
                <span className="ml-2 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  剩 {p.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
