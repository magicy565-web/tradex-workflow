"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/lib/user-context";
import {
  Plus,
  Globe,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  ExternalLink,
  Search,
} from "lucide-react";

/* ── placeholder types (keep in sync with geo.ts) ── */
interface GeoPage {
  id: string;
  slug: string;
  title: string;
  page_type: "product" | "factory";
  status: "draft" | "published" | "archived";
  content_score: number;
  published_at: string | null;
  created_at: string;
}

/* ── helpers ── */
const statusLabel: Record<string, { text: string; cls: string }> = {
  draft: { text: "草稿", cls: "bg-gray-100 text-gray-600" },
  published: { text: "已发布", cls: "bg-emerald-50 text-emerald-700" },
  archived: { text: "已归档", cls: "bg-red-50 text-red-600" },
};

const typeLabel: Record<string, string> = { product: "产品", factory: "工厂" };

function ScoreBar({ score }: { score: number }) {
  const color = score >= 60 ? "bg-emerald-500" : score >= 30 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-500">{score}</span>
    </div>
  );
}

export default function GeoPagesPage() {
  const { user } = useUser();
  const [pages, setPages] = useState<GeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPages = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    fetch(`/api/geo/pages${qs}`)
      .then((r) => r.json())
      .then((d) => setPages(d.pages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, statusFilter]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handlePublishToggle = async (page: GeoPage) => {
    setActionLoading(page.id);
    try {
      const action = page.status === "published" ? "unpublish" : "publish";
      const res = await fetch(`/api/geo/pages/${page.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchPages();
      else {
        const err = await res.json();
        alert(err.error || "操作失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerate = async (pageType: "product" | "factory") => {
    setGenerating(true);
    try {
      const confirmed = confirm(
        `批量生成所有${pageType === "product" ? "产品" : "工厂"} GEO 页面？\n\n已有页面的实体会自动跳过。`
      );
      if (!confirmed) return;

      const res = await fetch("/api/geo/pages/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_type: pageType }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`生成完成: 新增 ${data.generated} 个页面${data.failed > 0 ? `，${data.failed} 个失败` : ""}${data.already_existed > 0 ? `，${data.already_existed} 个已存在` : ""}`);
        fetchPages();
      } else {
        alert(data.error || "生成失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">GEO 页面管理</h2>
          <p className="mt-1 text-sm text-gray-500">管理 AI 搜索优化页面，提升内容评分获得更多引用</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerate("product")}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> 生成产品页
          </button>
          <button
            onClick={() => handleGenerate("factory")}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> 生成工厂页
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {[
          { key: "all", label: "全部" },
          { key: "draft", label: "草稿" },
          { key: "published", label: "已发布" },
          { key: "archived", label: "已归档" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === f.key
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-black/[0.06] hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={fetchPages}
          className="ml-auto rounded-lg border border-black/[0.06] bg-white p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          title="刷新"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-black/[0.06] bg-white p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-900">暂无 GEO 页面</p>
          <p className="mt-1 text-xs text-gray-500">从产品或工厂数据自动生成 AI 优化页面</p>
        </div>
      ) : (
        <div className="rounded-xl border border-black/[0.06] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">页面</th>
                  <th className="px-4 py-3 font-medium text-gray-500">类型</th>
                  <th className="px-4 py-3 font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 font-medium text-gray-500">内容评分</th>
                  <th className="px-4 py-3 font-medium text-gray-500">创建时间</th>
                  <th className="px-4 py-3 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const st = statusLabel[page.status] || statusLabel.draft;
                  const prefix = page.page_type === "factory" ? "/s/f/" : "/s/p/";
                  return (
                    <tr key={page.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-xs">{page.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{prefix}{page.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                          {page.page_type === "factory" ? (
                            <Globe className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          {typeLabel[page.page_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar score={page.content_score} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(page.created_at).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {page.status === "published" && (
                            <a
                              href={`${prefix}${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                              title="查看页面"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handlePublishToggle(page)}
                            disabled={actionLoading === page.id || page.status === "archived"}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
                            title={page.status === "published" ? "取消发布" : "发布"}
                          >
                            {actionLoading === page.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : page.status === "published" ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
