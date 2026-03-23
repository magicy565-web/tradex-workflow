"use client";

import { useState } from "react";
import {
  Upload,
  Users,
  TrendingUp,
  Star,
  ArrowRightLeft,
} from "lucide-react";

const stats = [
  { label: "总线索数", value: "128", icon: Users, color: "text-indigo-600" },
  { label: "本周新增", value: "17", icon: TrendingUp, color: "text-emerald-600" },
  { label: "高意向", value: "34", icon: Star, color: "text-amber-600" },
  { label: "转化率", value: "18.7%", icon: ArrowRightLeft, color: "text-violet-600" },
];

type LeadStatus = "新线索" | "已联系" | "高意向" | "已转化" | "已流失";

interface Lead {
  company: string;
  contact: string;
  email: string;
  country: string;
  source: string;
  score: number;
  status: LeadStatus;
  time: string;
}

const statusConfig: Record<LeadStatus, string> = {
  新线索: "bg-blue-50 text-blue-700",
  已联系: "bg-amber-50 text-amber-700",
  高意向: "bg-emerald-50 text-emerald-700",
  已转化: "bg-indigo-50 text-indigo-700",
  已流失: "bg-gray-100 text-gray-500",
};

const tabs: { label: string; filter: LeadStatus | null }[] = [
  { label: "全部", filter: null },
  { label: "新线索", filter: "新线索" },
  { label: "已联系", filter: "已联系" },
  { label: "高意向", filter: "高意向" },
  { label: "已转化", filter: "已转化" },
];

const leads: Lead[] = [
  {
    company: "Vietnam Plastics JSC",
    contact: "Nguyen Van Hoa",
    email: "hoa.nguyen@vnplastics.vn",
    country: "越南",
    source: "Google Ads",
    score: 82,
    status: "高意向",
    time: "2026-03-23",
  },
  {
    company: "PT Jayamold Indonesia",
    contact: "Budi Santoso",
    email: "budi@jayamold.co.id",
    country: "印尼",
    source: "独立站询盘",
    score: 75,
    status: "已联系",
    time: "2026-03-22",
  },
  {
    company: "Antalya Plastik A.S.",
    contact: "Mehmet Yilmaz",
    email: "mehmet@antalyaplastik.com.tr",
    country: "土耳其",
    source: "阿里国际站",
    score: 91,
    status: "高意向",
    time: "2026-03-21",
  },
  {
    company: "Moldebras Ltda.",
    contact: "Carlos Ferreira",
    email: "carlos@moldebras.com.br",
    country: "巴西",
    source: "展会名片",
    score: 45,
    status: "新线索",
    time: "2026-03-21",
  },
  {
    company: "Saigon Injection Co.",
    contact: "Tran Minh Duc",
    email: "duc.tran@saigoninjection.vn",
    country: "越南",
    source: "独立站询盘",
    score: 68,
    status: "已转化",
    time: "2026-03-19",
  },
  {
    company: "Surabaya Mold Works",
    contact: "Andi Wijaya",
    email: "andi@surabayamold.co.id",
    country: "印尼",
    source: "Google Ads",
    score: 22,
    status: "已流失",
    time: "2026-03-18",
  },
  {
    company: "Istanbul Enjeksiyon Ltd.",
    contact: "Ayse Demir",
    email: "ayse@istanbulenjeksiyon.com.tr",
    country: "土耳其",
    source: "LinkedIn",
    score: 55,
    status: "已联系",
    time: "2026-03-17",
  },
  {
    company: "Bangkok Precision Mold",
    contact: "Somchai Rattana",
    email: "somchai@bkkprecision.co.th",
    country: "泰国",
    source: "阿里国际站",
    score: 37,
    status: "新线索",
    time: "2026-03-16",
  },
];

function ScoreBar({ score }: { score: number }) {
  const color =
    score < 30
      ? "bg-red-500"
      : score <= 60
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-500">{score}</span>
    </div>
  );
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<LeadStatus | null>(null);

  const filtered = activeTab
    ? leads.filter((l) => l.status === activeTab)
    : leads;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            线索管理
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            智能线索推送与成交预测
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">
          <Upload className="h-4 w-4" />
          导入线索
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-black/[0.06] bg-white p-6"
          >
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
            </div>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-black/[0.06] bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.filter)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              activeTab === tab.filter
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 font-medium text-gray-500">公司名称</th>
              <th className="px-6 py-3 font-medium text-gray-500">联系人</th>
              <th className="px-6 py-3 font-medium text-gray-500">邮箱</th>
              <th className="px-6 py-3 font-medium text-gray-500">国家</th>
              <th className="px-6 py-3 font-medium text-gray-500">来源</th>
              <th className="px-6 py-3 font-medium text-gray-500">评分</th>
              <th className="px-6 py-3 font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 font-medium text-gray-500">操作时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((lead, i) => (
              <tr key={i} className="transition hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {lead.company}
                </td>
                <td className="px-6 py-4 text-gray-700">{lead.contact}</td>
                <td className="px-6 py-4 text-gray-500">{lead.email}</td>
                <td className="px-6 py-4 text-gray-700">{lead.country}</td>
                <td className="px-6 py-4 text-gray-700">{lead.source}</td>
                <td className="px-6 py-4">
                  <ScoreBar score={lead.score} />
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[lead.status]}`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{lead.time}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-sm text-gray-400"
                >
                  暂无匹配的线索
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
