"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/lib/user-context";
import {
  Loader2,
  RefreshCw,
  Inbox,
  Mail,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GeoInquiry {
  id: string;
  contact_name: string;
  email: string;
  company_name: string | null;
  country: string | null;
  inquiry_type: string;
  message: string | null;
  quantity_estimate: string | null;
  status: string;
  source: string;
  created_at: string;
  page_title?: string;
  page_slug?: string;
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

const STATUS_OPTIONS = [
  { value: "new", label: "新询盘", cls: "bg-blue-50 text-blue-700" },
  { value: "contacted", label: "已联系", cls: "bg-amber-50 text-amber-700" },
  { value: "qualified", label: "已确认", cls: "bg-emerald-50 text-emerald-700" },
  { value: "converted", label: "已成交", cls: "bg-indigo-50 text-indigo-700" },
  { value: "closed", label: "已关闭", cls: "bg-gray-100 text-gray-600" },
];

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  wholesale: "批发",
  oem: "OEM",
  odm: "ODM",
  sample: "样品",
  distribution: "分销",
  other: "其他",
};

function getStatusStyle(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

export default function GeoInquiriesPage() {
  const { user } = useUser();
  const [inquiries, setInquiries] = useState<GeoInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInquiries = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    fetch(`/api/geo/inquiries${qs}`)
      .then((r) => r.json())
      .then((d) => setInquiries(d.inquiries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, statusFilter]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/geo/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
        );
      }
    } catch {
      // silent
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">GEO 询盘</h2>
        <p className="mt-1 text-sm text-gray-500">通过 AI 搜索引擎优化页面获得的客户询盘</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 border border-black/[0.06] hover:bg-gray-50"
          }`}
        >
          全部
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-black/[0.06] hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={fetchInquiries}
          className="ml-auto rounded-lg border border-black/[0.06] bg-white p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          title="刷新"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border border-black/[0.06] bg-white p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-900">暂无询盘</p>
          <p className="mt-1 text-xs text-gray-500">发布 GEO 页面后，客户询盘将显示在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const st = getStatusStyle(inq.status);
            const expanded = expandedId === inq.id;
            return (
              <div
                key={inq.id}
                className="rounded-xl border border-black/[0.06] bg-white transition-shadow hover:shadow-sm"
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(expanded ? null : inq.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{inq.contact_name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        {SOURCE_LABELS[inq.source] || inq.source}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {inq.email}
                      </span>
                      {inq.company_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {inq.company_name}
                        </span>
                      )}
                      {inq.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {inq.country}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(inq.created_at).toLocaleDateString("zh-CN")}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-300">
                      {INQUIRY_TYPE_LABELS[inq.inquiry_type] || inq.inquiry_type}
                      {inq.quantity_estimate ? ` · ${inq.quantity_estimate}` : ""}
                    </p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-300" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-300" />
                  )}
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-gray-50 px-5 py-4 space-y-4">
                    {inq.page_title && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">来源页面</p>
                        <p className="mt-0.5 text-sm text-gray-700">{inq.page_title}</p>
                      </div>
                    )}
                    {inq.message && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">留言</p>
                        <p className="mt-0.5 text-sm text-gray-700 whitespace-pre-wrap">{inq.message}</p>
                      </div>
                    )}
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500">更新状态</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(inq.id, opt.value)}
                            disabled={updatingId === inq.id || inq.status === opt.value}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              inq.status === opt.value
                                ? `${opt.cls} ring-2 ring-offset-1 ring-indigo-300`
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            } disabled:opacity-50`}
                          >
                            {updatingId === inq.id ? (
                              <Loader2 className="inline h-3 w-3 animate-spin" />
                            ) : (
                              opt.label
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
