"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import {
  Search,
  Eye,
  MessageSquare,
  TrendingUp,
  FileText,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

interface GeoOverview {
  totals: {
    visits: number;
    ai_visits: number;
    inquiries: number;
    conversion_rate: number;
  };
  ai_breakdown: Record<string, number>;
  page_counts: { total: number; published: number; draft: number };
  top_pages: { slug: string; title: string; visits: number; inquiries: number }[];
  trend: { date: string; visits: number; ai_visits: number; inquiries: number }[];
}

const SOURCE_LABELS: Record<string, string> = {
  ai_chatgpt: "ChatGPT",
  ai_perplexity: "Perplexity",
  ai_google: "Google AI",
  ai_bing: "Bing Copilot",
  organic: "自然搜索",
  direct: "直接访问",
  referral: "外链",
  other: "其他",
};

export default function GeoOverviewPage() {
  const { user } = useUser();
  const [data, setData] = useState<GeoOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/geo/analytics/overview?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, period]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-6">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-7 w-12 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totals = data?.totals ?? { visits: 0, ai_visits: 0, inquiries: 0, conversion_rate: 0 };
  const pageCounts = data?.page_counts ?? { total: 0, published: 0, draft: 0 };

  const kpis = [
    { label: "总访问量", value: totals.visits, icon: Eye, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "AI 流量", value: totals.ai_visits, icon: Search, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "询盘数", value: totals.inquiries, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
    {
      label: "转化率",
      value: `${totals.conversion_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">GEO 概览</h2>
          <p className="mt-1 text-sm text-gray-500">
            AI 搜索引擎优化效果，{pageCounts.published} 个页面已发布
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                period === d
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 border border-black/[0.06] hover:bg-gray-50"
              }`}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl border border-black/[0.06] bg-white p-6">
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-1.5 ${kpi.bg}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
              </div>
              <p className={`mt-3 text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* AI Source Breakdown */}
      {data?.ai_breakdown && Object.keys(data.ai_breakdown).length > 0 && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-gray-900">AI 流量来源</h3>
          <div className="space-y-3">
            {Object.entries(data.ai_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => {
                const pct = totals.ai_visits > 0 ? (count / totals.ai_visits) * 100 : 0;
                return (
                  <div key={source} className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-sm text-gray-600">
                      {SOURCE_LABELS[source] || source}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right text-sm font-medium text-gray-900">
                      {count}
                    </span>
                    <span className="w-12 text-right text-xs text-gray-400">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Trend (simple table view) */}
      {data?.trend && data.trend.length > 0 && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-gray-900">流量趋势</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">日期</th>
                  <th className="pb-2 text-right font-medium text-gray-500">访问</th>
                  <th className="pb-2 text-right font-medium text-gray-500">AI 流量</th>
                  <th className="pb-2 text-right font-medium text-gray-500">询盘</th>
                </tr>
              </thead>
              <tbody>
                {data.trend.slice(-14).map((row) => (
                  <tr key={row.date} className="border-b border-gray-50">
                    <td className="py-2 text-gray-600">{row.date}</td>
                    <td className="py-2 text-right font-medium">{row.visits}</td>
                    <td className="py-2 text-right font-medium text-emerald-600">{row.ai_visits}</td>
                    <td className="py-2 text-right font-medium text-amber-600">{row.inquiries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Pages */}
      {data?.top_pages && data.top_pages.length > 0 && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">热门页面</h3>
            <Link
              href="/dashboard/geo/pages"
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              查看全部 <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {data.top_pages.map((p) => (
              <div
                key={p.slug}
                className="flex items-center justify-between rounded-lg border border-gray-50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-400">/s/p/{p.slug}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{p.visits}</p>
                    <p className="text-[10px] text-gray-400">访问</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-600">{p.inquiries}</p>
                    <p className="text-[10px] text-gray-400">询盘</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">快速操作</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/dashboard/geo/pages"
            className="group flex flex-col justify-between rounded-xl border border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 p-6 text-white transition-shadow hover:shadow-md"
          >
            <div>
              <p className="text-base font-semibold text-white">生成 GEO 页面</p>
              <p className="mt-1 text-sm text-white/80">从产品和工厂自动生成 AI 优化页面</p>
            </div>
            <span className="mt-4 text-sm font-medium text-white/90">前往 &rarr;</span>
          </Link>
          <Link
            href="/dashboard/geo/inquiries"
            className="group flex flex-col justify-between rounded-xl border border-black/[0.06] bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div>
              <p className="text-base font-semibold text-gray-900">管理询盘</p>
              <p className="mt-1 text-sm text-gray-500">查看和跟进 GEO 带来的商机</p>
            </div>
            <span className="mt-4 text-sm font-medium text-indigo-500">前往 &rarr;</span>
          </Link>
          <Link
            href="/dashboard/geo/pages"
            className="group flex flex-col justify-between rounded-xl border border-black/[0.06] bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div>
              <p className="text-base font-semibold text-gray-900">优化内容</p>
              <p className="mt-1 text-sm text-gray-500">提升内容评分，增加 AI 引用概率</p>
            </div>
            <span className="mt-4 text-sm font-medium text-indigo-500">前往 &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
