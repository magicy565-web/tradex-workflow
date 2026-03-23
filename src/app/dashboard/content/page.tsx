"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  MessageSquare,
  Mail,
  Video,
  ChevronDown,
  Sparkles,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ── stats ── */
const stats = [
  { label: "本月生成", value: "36", color: "text-indigo-600" },
  { label: "待审核", value: "5", color: "text-amber-600" },
  { label: "已发布", value: "24", color: "text-emerald-600" },
  { label: "积分消耗", value: "1,280", color: "text-violet-600" },
];

/* ── filter tabs ── */
const tabs = ["全部", "产品描述", "社媒帖子", "开发信", "视频脚本"] as const;
type Tab = (typeof tabs)[number];

/* ── type config ── */
const typeConfig: Record<
  string,
  { icon: typeof FileText; bg: string; text: string }
> = {
  产品描述: { icon: FileText, bg: "bg-blue-50", text: "text-blue-700" },
  社媒帖子: { icon: MessageSquare, bg: "bg-purple-50", text: "text-purple-700" },
  开发信: { icon: Mail, bg: "bg-amber-50", text: "text-amber-700" },
  视频脚本: { icon: Video, bg: "bg-rose-50", text: "text-rose-700" },
};

const statusConfig: Record<string, { bg: string; text: string }> = {
  已发布: { bg: "bg-emerald-50", text: "text-emerald-700" },
  待审核: { bg: "bg-amber-50", text: "text-amber-700" },
  草稿: { bg: "bg-gray-100", text: "text-gray-600" },
};

/* ── mock data ── */
const mockContents = [
  {
    id: 1,
    type: "产品描述" as const,
    title: "HXM260-II 伺服液压注塑机产品详情",
    preview:
      "The HXM260-II servo hydraulic injection molding machine delivers exceptional precision with a clamping force of 260 tons. Designed for high-efficiency production of automotive parts and household appliances...",
    platform: "独立站",
    status: "已发布",
    date: "2026-03-22",
  },
  {
    id: 2,
    type: "社媒帖子" as const,
    title: "LinkedIn 新品发布 — 全电动注塑机 AE150",
    preview:
      "Introducing the AE150 All-Electric Injection Molding Machine — 40% energy savings, ultra-precise repeatability, and whisper-quiet operation. Perfect for medical and electronics manufacturing...",
    platform: "LinkedIn",
    status: "已发布",
    date: "2026-03-21",
  },
  {
    id: 3,
    type: "开发信" as const,
    title: "越南客户开发信 — 汽车配件注塑方案",
    preview:
      "Dear Mr. Nguyen, I hope this message finds you well. We specialize in servo hydraulic injection molding machines tailored for automotive component production. Our HXM series offers...",
    platform: "WhatsApp",
    status: "待审核",
    date: "2026-03-21",
  },
  {
    id: 4,
    type: "视频脚本" as const,
    title: "二板式注塑机 1000T 工厂实拍脚本",
    preview:
      "场景一：工厂全景航拍，旁白：Welcome to our state-of-the-art manufacturing facility. 场景二：二板式注塑机特写，展示超大锁模力合模过程...",
    platform: "独立站",
    status: "草稿",
    date: "2026-03-20",
  },
  {
    id: 5,
    type: "产品描述" as const,
    title: "立式注塑机 VM-85 嵌件成型专用机型",
    preview:
      "The VM-85 vertical injection molding machine is purpose-built for insert molding applications. With rotary table options and an open clamp design, operators can easily place inserts for connectors...",
    platform: "独立站",
    status: "已发布",
    date: "2026-03-19",
  },
  {
    id: 6,
    type: "社媒帖子" as const,
    title: "Chinaplas 2026 展会预告帖",
    preview:
      "We are excited to announce our participation in Chinaplas 2026! Visit us at Hall 5, Booth J42 to experience our latest all-electric and two-platen injection molding machines...",
    platform: "LinkedIn",
    status: "待审核",
    date: "2026-03-18",
  },
  {
    id: 7,
    type: "开发信" as const,
    title: "印尼包装行业客户开发信",
    preview:
      "Dear PT Indo Packing team, We noticed your company is expanding thin-wall packaging production. Our high-speed injection molding machines achieve cycle times under 4 seconds for food containers...",
    platform: "WhatsApp",
    status: "已发布",
    date: "2026-03-17",
  },
  {
    id: 8,
    type: "视频脚本" as const,
    title: "伺服节能系统对比演示视频脚本",
    preview:
      "开场：分屏对比画面 — 左侧传统定量泵机型，右侧伺服液压机型。数据面板实时显示能耗差异。旁白：See the difference servo technology makes...",
    platform: "独立站",
    status: "草稿",
    date: "2026-03-16",
  },
];

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("全部");
  const [showForm, setShowForm] = useState(false);

  const filtered =
    activeTab === "全部"
      ? mockContents
      : mockContents.filter((c) => c.type === activeTab);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            内容生成
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            AIGC 多平台内容自动生成
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          新建内容
        </button>
      </div>

      {/* ── Generate Form Section ── */}
      {showForm && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            生成内容
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                内容类型
              </label>
              <div className="relative">
                <select className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100">
                  <option>产品描述</option>
                  <option>社媒帖子</option>
                  <option>开发信</option>
                  <option>视频脚本</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                产品选择
              </label>
              <div className="relative">
                <select className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100">
                  <option>HXM260-II 伺服液压注塑机</option>
                  <option>AE150 全电动注塑机</option>
                  <option>TP1000 二板式注塑机</option>
                  <option>VM-85 立式注塑机</option>
                  <option>HS380 肘杆式注塑机</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                目标语言
              </label>
              <div className="relative">
                <select className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>Arabic</option>
                  <option>Russian</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex items-end">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90">
                <Sparkles className="h-4 w-4" />
                生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-black/[0.06] bg-white p-6"
          >
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeTab === tab
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Content Cards Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((item) => {
          const tc = typeConfig[item.type];
          const sc = statusConfig[item.status];
          const Icon = tc.icon;

          return (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-xl border border-black/[0.06] bg-white p-5 transition-shadow hover:shadow-md"
            >
              {/* Top row: type badge + status */}
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tc.bg} ${tc.text}`}
                >
                  <Icon className="h-3 w-3" />
                  {item.type}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}
                >
                  {item.status === "已发布" && (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {item.status === "待审核" && (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {item.status === "草稿" && <Clock className="h-3 w-3" />}
                  {item.status}
                </span>
              </div>

              {/* Title */}
              <h4 className="mt-3 text-sm font-semibold text-gray-900 line-clamp-1">
                {item.title}
              </h4>

              {/* Preview text */}
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500 line-clamp-2">
                {item.preview}
              </p>

              {/* Bottom row: platform + date */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                  <Eye className="h-3 w-3" />
                  {item.platform}
                </span>
                <span className="text-xs text-gray-400">{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
