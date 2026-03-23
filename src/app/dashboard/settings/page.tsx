"use client";

import { useEffect, useState } from "react";
import {
  User,
  CreditCard,
  KeyRound,
  AlertTriangle,
  Copy,
  RefreshCw,
  Check,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";

interface CreditTransaction {
  id: string;
  action: string;
  description: string | null;
  amount: number;
  created_at: string;
}

const planLabels: Record<string, string> = {
  trial: "试用版",
  pro: "Pro 专业版",
  enterprise: "企业版",
};

const planCredits: Record<string, number> = {
  trial: 1000,
  pro: 10000,
  enterprise: 50000,
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { user, profile: userProfile, loading: userLoading, refreshProfile } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    companyEn: "",
  });
  const [formLoaded, setFormLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);

  // Load profile data into form
  useEffect(() => {
    if (!user || formLoaded) return;
    setFormData({
      name: userProfile?.full_name || user.user_metadata?.full_name || "",
      email: user.email || "",
      phone: "",
      company: userProfile?.company_name || "",
      companyEn: "",
    });
    setFormLoaded(true);
  }, [user, userProfile, formLoaded]);

  // Fetch credit history
  useEffect(() => {
    if (!user) return;
    async function fetchHistory() {
      const supabase = createClient();
      const { data } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setCreditHistory(data);
    }
    fetchHistory();
  }, [user]);

  const currentPlan = userProfile?.plan ?? "trial";
  const totalCredits = planCredits[currentPlan] ?? 1000;
  const remainingCredits = userProfile?.credits ?? 0;
  const usedCredits = totalCredits - remainingCredits;
  const creditsPercent = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;

  function handleProfileChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: formData.name, company_name: formData.company }),
      });
      if (res.ok) {
        setSaveMsg("已保存");
        await refreshProfile();
        setTimeout(() => setSaveMsg(""), 2000);
      } else {
        setSaveMsg("保存失败");
      }
    } catch {
      setSaveMsg("保存失败");
    }
    setSaving(false);
  }

  function handleCopyKey() {
    navigator.clipboard.writeText("sk-tradex-••••••••••••••••");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
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
                value={formData.name}
                onChange={(e) => handleProfileChange("name", e.target.value)}
              />
            </div>

            {/* 邮箱 */}
            <div>
              <label className={labelCls}>邮箱</label>
              <input
                className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
                value={formData.email}
                disabled
                readOnly
              />
            </div>

            {/* 手机号 */}
            <div>
              <label className={labelCls}>手机号</label>
              <input
                className={inputCls}
                value={formData.phone}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
              />
            </div>

            {/* 公司名称 */}
            <div>
              <label className={labelCls}>公司名称</label>
              <input
                className={inputCls}
                value={formData.company}
                onChange={(e) => handleProfileChange("company", e.target.value)}
              />
            </div>

            {/* 公司英文名 */}
            <div className="sm:col-span-2">
              <label className={labelCls}>公司英文名</label>
              <input
                className={inputCls}
                value={formData.companyEn}
                onChange={(e) =>
                  handleProfileChange("companyEn", e.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {saveMsg && (
              <span className={`text-sm ${saveMsg === "已保存" ? "text-emerald-600" : "text-red-500"}`}>
                {saveMsg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存"}
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
                {planLabels[currentPlan] || currentPlan}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                剩余积分: {remainingCredits.toLocaleString()}
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
                {usedCredits.toLocaleString()} /{" "}
                {totalCredits.toLocaleString()}（{creditsPercent}%）
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
                  {creditHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-sm text-gray-400">
                        暂无积分变动记录
                      </td>
                    </tr>
                  ) : (
                    creditHistory.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2.5 text-gray-500">
                          {new Date(entry.created_at).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-2.5 text-gray-900">
                          {entry.description || entry.action}
                        </td>
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
                    ))
                  )}
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
                value="sk-tradex-••••••••••••••••••••"
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
