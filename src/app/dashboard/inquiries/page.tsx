"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";

interface Inquiry {
  id: string;
  site_id: string;
  user_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_company: string | null;
  message: string | null;
  product_interest: string | null;
  status: "new" | "replied" | "quoted" | "closed";
  created_at: string;
  sites: {
    name: string;
    company_name_en: string | null;
  } | null;
}

const STATUS_MAP: Record<
  Inquiry["status"],
  { label: string; className: string }
> = {
  new: { label: "新询盘", className: "bg-blue-50 text-blue-700" },
  replied: { label: "已回复", className: "bg-emerald-50 text-emerald-700" },
  quoted: { label: "已报价", className: "bg-amber-50 text-amber-700" },
  closed: { label: "已成交", className: "bg-violet-50 text-violet-700" },
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}天前`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}个月前`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}年前`;
}

export default function InquiriesPage() {
  const { user, loading: userLoading } = useUser();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchInquiries() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("inquiries")
        .select("*, sites(name, company_name_en)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setInquiries(data as Inquiry[]);
      }
      setLoading(false);
    }

    fetchInquiries();
  }, [user, userLoading]);

  const isLoading = userLoading || loading;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          询盘中心
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          收集和管理客户询盘
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 font-medium text-gray-500">客户</th>
              <th className="px-6 py-3 font-medium text-gray-500">邮箱</th>
              <th className="px-6 py-3 font-medium text-gray-500">产品需求</th>
              <th className="px-6 py-3 font-medium text-gray-500">来源站点</th>
              <th className="px-6 py-3 font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 font-medium text-gray-500">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : inquiries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <p className="text-base font-medium text-gray-900">
                    暂无询盘
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    当客户通过您的站点提交询盘后，将会显示在这里
                  </p>
                </td>
              </tr>
            ) : (
              inquiries.map((row) => {
                const status = STATUS_MAP[row.status] ?? STATUS_MAP.new;
                return (
                  <tr key={row.id} className="transition hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {row.customer_company || row.customer_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.customer_email || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.product_interest || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.sites?.company_name_en || row.sites?.name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {relativeTime(row.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
