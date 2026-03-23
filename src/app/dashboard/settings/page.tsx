"use client";

import { useState } from "react";
import {
  User,
  CreditCard,
  KeyRound,
  AlertTriangle,
  Copy,
  RefreshCw,
  Check,
  ArrowUpRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

const initialProfile = {
  name: "张明远",
  email: "mingyuan@tradex.com",
  phone: "138-0013-8000",
  company: "深圳明远贸易有限公司",
  companyEn: "Shenzhen Mingyuan Trading Co., Ltd.",
};

const plan = {
  name: "Pro 专业版",
  price: "¥799/月",
  renewalDate: "2026-04-23",
};

const credits = {
  used: 2158,
  total: 10000,
};

const creditHistory = [
  { date: "2026-03-22", action: "AI 内容生成", amount: -30 },
  { date: "2026-03-20", action: "询盘智能回复", amount: -12 },
  { date: "2026-03-18", action: "月度积分发放", amount: +5000 },
  { date: "2026-03-15", action: "站点 SEO 优化", amount: -80 },
  { date: "2026-03-12", action: "线索评分分析", amount: -20 },
];

const MOCK_API_KEY = "sk-tradex-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function maskKey(key: string) {
  return key.slice(0, 10) + "••••••••••••••••" + key.slice(-4);
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const [profile, setProfile] = useState(initialProfile);
  const [copied, setCopied] = useState(false);
  const [keyRevealed] = useState(false);

  const creditsPercent = Math.round((credits.used / credits.total) * 100);

  function handleProfileChange(field: string, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleCopyKey() {
    navigator.clipboard.writeText(MOCK_API_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ---- shared styles ---- */
  const card = "rounded-xl border border-black/[0.06] bg-white p-6";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          系统设置
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          账户、套餐、API 密钥与安全配置
        </p>
      </div>

      {/* ============================================================ */}
      {/*  Section 1 – 账户信息                                         */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900">账户信息</h2>
        </div>

        <div className={card}>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* 姓名 */}
            <div>
              <label className={labelCls}>姓名</label>
              <input
                className={inputCls}
                value={profile.name}
                onChange={(e) => handleProfileChange("name", e.target.value)}
              />
            </div>

            {/* 邮箱 */}
            <div>
              <label className={labelCls}>邮箱</label>
              <input
                className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
                value={profile.email}
                disabled
                readOnly
              />
            </div>

            {/* 手机号 */}
            <div>
              <label className={labelCls}>手机号</label>
              <input
                className={inputCls}
                value={profile.phone}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
              />
            </div>

            {/* 公司名称 */}
            <div>
              <label className={labelCls}>公司名称</label>
              <input
                className={inputCls}
                value={profile.company}
                onChange={(e) => handleProfileChange("company", e.target.value)}
              />
            </div>

            {/* 公司英文名 */}
            <div className="sm:col-span-2">
              <label className={labelCls}>公司英文名</label>
              <input
                className={inputCls}
                value={profile.companyEn}
                onChange={(e) =>
                  handleProfileChange("companyEn", e.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]">
              保存
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Section 2 – 套餐与积分                                       */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900">套餐与积分</h2>
        </div>

        <div className={card}>
          {/* Current plan */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">当前套餐</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {plan.name}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {plan.price} &middot; 续费日期 {plan.renewalDate}
              </p>
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 active:scale-[0.98]">
              升级套餐
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {/* Divider */}
          <hr className="my-6 border-gray-100" />

          {/* Credits usage bar */}
          <div>
            <div className="flex items-end justify-between">
              <p className="text-sm font-medium text-gray-700">积分用量</p>
              <p className="text-sm text-gray-500">
                {credits.used.toLocaleString()} /{" "}
                {credits.total.toLocaleString()}（{creditsPercent}%）
              </p>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="my-6 border-gray-100" />

          {/* Transaction history */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              最近积分变动
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="pb-2 font-medium">日期</th>
                    <th className="pb-2 font-medium">操作</th>
                    <th className="pb-2 text-right font-medium">积分</th>
                  </tr>
                </thead>
                <tbody>
                  {creditHistory.map((entry, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-2.5 text-gray-500">{entry.date}</td>
                      <td className="py-2.5 text-gray-900">{entry.action}</td>
                      <td
                        className={`py-2.5 text-right font-medium ${
                          entry.amount > 0
                            ? "text-emerald-600"
                            : "text-gray-900"
                        }`}
                      >
                        {entry.amount > 0 ? "+" : ""}
                        {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Section 3 – API 密钥                                         */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900">API 密钥</h2>
        </div>

        <div className={card}>
          {/* Key field */}
          <div>
            <label className={labelCls}>密钥</label>
            <div className="flex items-center gap-2">
              <input
                className={`${inputCls} flex-1 font-mono tracking-wide`}
                value={keyRevealed ? MOCK_API_KEY : maskKey(MOCK_API_KEY)}
                readOnly
              />
              <button
                onClick={handleCopyKey}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 active:scale-[0.97]"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "已复制" : "复制"}
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 active:scale-[0.97]">
                <RefreshCw className="h-4 w-4" />
                重新生成
              </button>
            </div>
          </div>

          {/* Usage stats */}
          <div className="mt-5 flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500">本月调用次数</p>
              <p className="mt-1 text-xl font-bold text-gray-900">1,284</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Section 4 – 危险操作                                         */}
      {/* ============================================================ */}
      <section className="space-y-4 pb-12">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">危险操作</h2>
        </div>

        <div className="rounded-xl border-2 border-red-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600">删除账户</p>
              <p className="mt-1 text-sm text-gray-500">
                此操作不可逆，将永久删除您的所有站点、询盘数据与配置信息。请谨慎操作。
              </p>
            </div>
            <button className="shrink-0 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 active:scale-[0.98]">
              删除账户
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
