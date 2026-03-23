"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";

interface KpiData {
  publishedSites: number;
  weeklyInquiries: number;
  closedLeads: number;
  credits: number;
}

const quickActions = [
  {
    label: "新建站点",
    description: "AI 一键生成外贸独立站",
    href: "/dashboard/build",
    gradient: true,
  },
  {
    label: "查看询盘",
    description: "处理最新客户询盘",
    href: "/dashboard/inquiries",
    gradient: false,
  },
  {
    label: "生成内容",
    description: "AI 生成产品描述与文案",
    href: "/dashboard/content",
    gradient: false,
  },
];

export default function DashboardPage() {
  const { user, profile, loading: userLoading } = useUser();
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchKpis() {
      const supabase = createClient();

      // Fetch published site count
      const { count: publishedSites } = await supabase
        .from("sites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "published");

      // Fetch user's site IDs for inquiry lookup
      const { data: userSites } = await supabase
        .from("sites")
        .select("id")
        .eq("user_id", user!.id);

      const siteIds = userSites?.map((s) => s.id) ?? [];

      // Fetch inquiries from the last 7 days
      let weeklyInquiries = 0;
      if (siteIds.length > 0) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count } = await supabase
          .from("inquiries")
          .select("*", { count: "exact", head: true })
          .in("site_id", siteIds)
          .gte("created_at", sevenDaysAgo.toISOString());

        weeklyInquiries = count ?? 0;
      }

      setKpiData({
        publishedSites: publishedSites ?? 0,
        weeklyInquiries,
        closedLeads: 0,
        credits: profile?.credits ?? 0,
      });
      setKpiLoading(false);
    }

    fetchKpis();
  }, [user, profile?.credits]);

  const loading = userLoading || kpiLoading;

  const kpis = [
    {
      label: "在线站点",
      value: kpiData?.publishedSites ?? 0,
      color: "text-indigo-600",
    },
    {
      label: "本周询盘",
      value: kpiData?.weeklyInquiries ?? 0,
      color: "text-emerald-600",
    },
    {
      label: "成交线索",
      value: kpiData?.closedLeads ?? 0,
      color: "text-amber-600",
    },
    {
      label: "剩余积分",
      value: kpiData?.credits?.toLocaleString() ?? "0",
      color: "text-violet-600",
    },
  ];

  const displayName = profile?.full_name || "用户";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome */}
      <div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              欢迎回来，{displayName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              以下是您的业务概览
            </p>
          </>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-black/[0.06] bg-white p-6"
              >
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 h-7 w-12 animate-pulse rounded bg-gray-200" />
              </div>
            ))
          : kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-black/[0.06] bg-white p-6"
              >
                <p className="text-xs font-medium text-gray-500">
                  {kpi.label}
                </p>
                <p className={`mt-2 text-2xl font-bold ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
            ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          快速操作
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`group flex flex-col justify-between rounded-xl border p-6 transition-shadow hover:shadow-md ${
                action.gradient
                  ? "border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
                  : "border-black/[0.06] bg-white"
              }`}
            >
              <div>
                <p
                  className={`text-base font-semibold ${action.gradient ? "text-white" : "text-gray-900"}`}
                >
                  {action.label}
                </p>
                <p
                  className={`mt-1 text-sm ${action.gradient ? "text-white/80" : "text-gray-500"}`}
                >
                  {action.description}
                </p>
              </div>
              <span
                className={`mt-4 text-sm font-medium ${action.gradient ? "text-white/90" : "text-indigo-500"}`}
              >
                前往 &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
