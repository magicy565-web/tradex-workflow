"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  FileText,
  Globe,
  MessageSquare,
  RefreshCw,
  Send,
  Smartphone,
  XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const WEBHOOK_URL = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=a3b7••••••••c9d1";

type PushType = "site" | "inquiry" | "report";
type PushStatus = "sent" | "failed" | "pending";

interface PushRecord {
  id: number;
  type: PushType;
  title: string;
  description: string;
  time: string;
  status: PushStatus;
}

const pushRecords: PushRecord[] = [
  {
    id: 1,
    type: "site",
    title: "站点上线通知",
    description: "宁波精机注塑 B2B 站已成功发布上线",
    time: "今天 14:32",
    status: "sent",
  },
  {
    id: 2,
    type: "inquiry",
    title: "新询盘提醒",
    description: "Vietnam Plastics Co. 提交了伺服液压注塑机 260T 询盘",
    time: "今天 11:05",
    status: "sent",
  },
  {
    id: 3,
    type: "report",
    title: "每日经营日报",
    description: "3月22日：访客 324 / 询盘 8 / 转化率 2.5%",
    time: "今天 09:00",
    status: "sent",
  },
  {
    id: 4,
    type: "inquiry",
    title: "新询盘提醒",
    description: "PT Indo Molding 提交了全电动注塑机 150T 询盘",
    time: "昨天 16:48",
    status: "sent",
  },
  {
    id: 5,
    type: "site",
    title: "站点构建完成",
    description: "浙江华塑机械官网构建完成，等待审核上线",
    time: "昨天 14:20",
    status: "sent",
  },
  {
    id: 6,
    type: "report",
    title: "每日经营日报",
    description: "3月21日：访客 298 / 询盘 5 / 转化率 1.7%",
    time: "昨天 09:00",
    status: "failed",
  },
  {
    id: 7,
    type: "inquiry",
    title: "新询盘提醒",
    description: "Bangkok Pack Ltd. 提交了二板式注塑机 1000T 询盘",
    time: "3月20日 10:15",
    status: "sent",
  },
  {
    id: 8,
    type: "inquiry",
    title: "线索匹配提醒",
    description: "Manila Container Corp 与历史客户画像高度匹配",
    time: "3月20日 08:30",
    status: "pending",
  },
  {
    id: 9,
    type: "report",
    title: "周报汇总",
    description: "第12周汇总：新增询盘 23 条，成交 4 单",
    time: "3月19日 09:00",
    status: "sent",
  },
  {
    id: 10,
    type: "site",
    title: "SSL 证书更新",
    description: "ningbo-jinji.tradex.com SSL 证书已自动续期",
    time: "3月18日 03:00",
    status: "sent",
  },
];

const notificationSettings = [
  {
    key: "site_online",
    label: "站点上线通知",
    description: "站点发布、更新、SSL 证书变更时推送通知",
    enabled: true,
  },
  {
    key: "new_inquiry",
    label: "新询盘提醒",
    description: "收到客户询盘时第一时间推送至企微群",
    enabled: true,
  },
  {
    key: "daily_report",
    label: "每日经营日报",
    description: "每天早上 9:00 推送前日访客、询盘、转化数据",
    enabled: true,
  },
  {
    key: "lead_match",
    label: "线索匹配提醒",
    description: "新线索与历史客户画像匹配时自动提醒",
    enabled: false,
  },
  {
    key: "weekly_summary",
    label: "周报汇总",
    description: "每周一推送上周经营数据与趋势分析",
    enabled: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const typeIcon: Record<PushType, typeof Globe> = {
  site: Globe,
  inquiry: MessageSquare,
  report: FileText,
};

const typeLabel: Record<PushType, string> = {
  site: "站点通知",
  inquiry: "询盘提醒",
  report: "经营日报",
};

const statusConfig: Record<
  PushStatus,
  { label: string; className: string }
> = {
  sent: { label: "已推送", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "失败", className: "bg-red-50 text-red-700" },
  pending: { label: "待推送", className: "bg-amber-50 text-amber-700" },
};

type FilterTab = "all" | PushType;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WecomPage() {
  const [connected] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationSettings.map((n) => [n.key, n.enabled])),
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredRecords =
    activeTab === "all"
      ? pushRecords
      : pushRecords.filter((r) => r.type === activeTab);

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "site", label: "站点通知" },
    { key: "inquiry", label: "询盘提醒" },
    { key: "report", label: "经营日报" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              企微集成
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                connected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {connected ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {connected ? "已连接" : "未连接"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            企业微信通知推送与经营触发
          </p>
        </div>
        <Smartphone className="h-8 w-8 text-gray-300" />
      </div>

      {/* Section A: 连接状态 */}
      <div className="rounded-xl border border-black/[0.06] bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900">连接状态</h3>
        <p className="mt-1 text-sm text-gray-500">
          当前 Webhook 地址与连接信息
        </p>

        <div className="mt-5 space-y-4">
          {/* Connection indicator */}
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {connected ? "Webhook 连接正常" : "Webhook 未连接"}
            </span>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Webhook URL
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm font-mono text-gray-600">
                {WEBHOOK_URL}
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </div>

          {/* Last push */}
          <p className="text-xs text-gray-400">
            最后推送时间：2026-03-23 14:32:08
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
              <Send className="h-3.5 w-3.5" />
              测试连接
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <RefreshCw className="h-3.5 w-3.5" />
              重新配置
            </button>
          </div>
        </div>
      </div>

      {/* Section B: 推送记录 */}
      <div className="rounded-xl border border-black/[0.06] bg-white">
        <div className="border-b border-gray-100 px-6 pt-5 pb-0">
          <h3 className="text-base font-semibold text-gray-900">推送记录</h3>
          <p className="mt-1 text-sm text-gray-500">
            最近的企微推送通知记录
          </p>

          {/* Filter tabs */}
          <div className="mt-4 flex gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-t-lg px-3.5 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline list */}
        <div className="divide-y divide-gray-100">
          {filteredRecords.map((record) => {
            const Icon = typeIcon[record.type];
            const status = statusConfig[record.status];
            return (
              <div
                key={record.id}
                className="flex items-start gap-4 px-6 py-4 transition hover:bg-gray-50/50"
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    record.type === "site"
                      ? "bg-blue-50 text-blue-600"
                      : record.type === "inquiry"
                        ? "bg-violet-50 text-violet-600"
                        : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {record.title}
                    </span>
                    <span className="text-xs text-gray-400">
                      {typeLabel[record.type]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {record.description}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                  <span className="text-xs text-gray-400">{record.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section C: 推送配置 */}
      <div className="rounded-xl border border-black/[0.06] bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900">推送配置</h3>
        <p className="mt-1 text-sm text-gray-500">
          选择需要推送至企微群的通知类型
        </p>

        <div className="mt-5 divide-y divide-gray-100">
          {notificationSettings.map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {setting.label}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {setting.description}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => handleToggle(setting.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  toggles[setting.key] ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    toggles[setting.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
