"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Plus, Loader2 } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";

interface Site {
  id: string;
  name: string;
  company_name: string | null;
  company_name_en: string | null;
  subdomain: string;
  status: "published" | "preview" | "generating";
  visitors: number;
  site_data: Record<string, unknown> | null;
  created_at: string;
}

const STATUS_MAP: Record<
  Site["status"],
  { label: string; className: string }
> = {
  published: { label: "已上线", className: "bg-emerald-50 text-emerald-700" },
  preview: { label: "预览中", className: "bg-blue-50 text-blue-700" },
  generating: { label: "生成中", className: "bg-amber-50 text-amber-700" },
};

export default function SitesPage() {
  const { user, loading: userLoading } = useUser();
  const [sites, setSites] = useState<Site[]>([]);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchSites() {
      const supabase = createClient();

      const { data: sitesData, error } = await supabase
        .from("sites")
        .select("id, name, company_name, company_name_en, subdomain, status, visitors, site_data, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch sites:", error);
        setLoading(false);
        return;
      }

      const fetchedSites: Site[] = sitesData ?? [];
      setSites(fetchedSites);

      // Fetch inquiry counts for all sites
      if (fetchedSites.length > 0) {
        const siteIds = fetchedSites.map((s) => s.id);
        const { data: inquiryData, error: inquiryError } = await supabase
          .from("inquiries")
          .select("site_id")
          .in("site_id", siteIds);

        if (!inquiryError && inquiryData) {
          const counts: Record<string, number> = {};
          for (const row of inquiryData) {
            counts[row.site_id] = (counts[row.site_id] || 0) + 1;
          }
          setInquiryCounts(counts);
        }
      }

      setLoading(false);
    }

    fetchSites();
  }, [user, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            我的站点
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            管理和编辑你的外贸站点
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-black/[0.06] bg-white p-6 animate-pulse"
            >
              <div>
                <div className="h-5 w-16 rounded-full bg-gray-200" />
                <div className="mt-3 h-5 w-3/4 rounded bg-gray-200" />
                <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="h-4 w-2/3 rounded bg-gray-100" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-9 w-20 rounded-lg bg-gray-200" />
                <div className="h-9 w-16 rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          我的站点
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          管理和编辑你的外贸站点
        </p>
      </div>

      {sites.length === 0 && !loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/build"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-6 text-gray-400 transition hover:border-indigo-300 hover:text-indigo-500"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">+ 新建站点</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const statusInfo = STATUS_MAP[site.status] ?? {
              label: site.status,
              className: "bg-gray-50 text-gray-700",
            };
            const inquiries = inquiryCounts[site.id] ?? 0;
            const isReady = site.status === "published" || site.status === "preview";

            return (
              <div
                key={site.id}
                className="flex flex-col justify-between rounded-xl border border-black/[0.06] bg-white p-6"
              >
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-gray-900">
                    {site.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {site.subdomain}.tradex.com
                  </p>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  {isReady ? (
                    <p className="text-sm text-gray-500">
                      访客{" "}
                      <span className="font-medium text-gray-900">
                        {site.visitors}
                      </span>
                      {" | "}询盘{" "}
                      <span className="font-medium text-gray-900">
                        {inquiries}
                      </span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      站点生成中…
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {isReady ? (
                    <>
                      <button className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
                        编辑站点
                      </button>
                      <a
                        href={`/site/${site.subdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        查看
                      </a>
                    </>
                  ) : (
                    <button className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                      查看进度
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* New site card */}
          <Link
            href="/dashboard/build"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-6 text-gray-400 transition hover:border-indigo-300 hover:text-indigo-500"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">+ 新建站点</span>
          </Link>
        </div>
      )}
    </div>
  );
}
