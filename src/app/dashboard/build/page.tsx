"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Check,
  Loader2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRODUCT_OPTIONS = [
  "伺服液压注塑机",
  "肘杆式注塑机",
  "二板式注塑机",
  "全电动注塑机",
  "立式注塑机",
];

const MARKET_OPTIONS = ["东南亚", "中东", "南美", "非洲", "南亚", "东欧"];

const GENERATION_STEPS = [
  { name: "理解业务场景", description: "分析你的公司信息与产品定位" },
  { name: "匹配注塑机行业模板", description: "从 200+ 行业模板中智能匹配" },
  { name: "生成站点骨架", description: "创建页面结构与导航" },
  { name: "生成文案与产品描述", description: "AI 撰写多语言营销文案" },
  { name: "配置 SEO 与询盘表单", description: "优化搜索引擎与转化组件" },
  { name: "准备发布", description: "最终检查并部署到全球 CDN" },
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FormData {
  companyName: string;
  companyEnName: string;
  products: string[];
  markets: string[];
  sellingPoints: string;
  email: string;
  whatsapp: string;
}

interface SiteData {
  hero: { tagline: string; headline: string; subheadline: string; cta_primary: string; cta_secondary: string };
  products: { name: string; description: string; specs: { label: string; value: string }[] }[];
  why_us: { title: string; description: string; stat: string }[];
  faq: { question: string; answer: string }[];
  seo: { title: string; description: string; keywords: string[] };
  about: { headline: string; paragraphs: string[]; certifications: string[] };
}

interface GenerationResult {
  siteData: SiteData;
  siteId: string | null;
  subdomain: string;
}

/* ------------------------------------------------------------------ */
/*  Reusable UI pieces                                                 */
/* ------------------------------------------------------------------ */

function StepIndicator({ current }: { current: number }) {
  const labels = ["业务信息", "AI 生成", "预览发布"];
  return (
    <div className="mb-8 flex items-center justify-center gap-3">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && (
              <div
                className={`h-px w-10 ${done || active ? "bg-indigo-400" : "bg-gray-200"}`}
              />
            )}
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-indigo-600 text-white"
                    : active
                      ? "border-2 border-indigo-600 text-indigo-600"
                      : "border border-gray-300 text-gray-400"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step}
              </span>
              <span
                className={`text-sm font-medium ${active ? "text-gray-900" : done ? "text-indigo-600" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt],
    );

  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-medium text-gray-700">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <label
              key={opt}
              className={`flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                checked
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(opt)}
              />
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  checked
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {checked && <Check className="h-3 w-3" />}
              </span>
              {opt}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 – Business Info Form                                        */
/* ------------------------------------------------------------------ */

function StepForm({
  form,
  setForm,
  onNext,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
}) {
  const canProceed =
    form.companyName.trim() !== "" && form.companyEnName.trim() !== "";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">描述你的业务</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          填写基本信息，AI 将为你生成专属外贸独立站
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-black/[0.06] bg-white p-6">
        {/* 公司名称 & 英文名 */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              公司名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyName: e.target.value }))
              }
              placeholder="例如：宁波海天精工机械"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              公司英文名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.companyEnName}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyEnName: e.target.value }))
              }
              placeholder="例如：Ningbo Haitian Precision Machinery"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* 主营产品 */}
        <CheckboxGroup
          label="主营产品"
          options={PRODUCT_OPTIONS}
          selected={form.products}
          onChange={(v) => setForm((f) => ({ ...f, products: v }))}
        />

        {/* 目标市场 */}
        <CheckboxGroup
          label="目标市场"
          options={MARKET_OPTIONS}
          selected={form.markets}
          onChange={(v) => setForm((f) => ({ ...f, markets: v }))}
        />

        {/* 核心卖点 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            核心卖点
          </label>
          <textarea
            rows={3}
            value={form.sellingPoints}
            onChange={(e) =>
              setForm((f) => ({ ...f, sellingPoints: e.target.value }))
            }
            placeholder="例如：20年生产经验，ISO认证，提供安装培训..."
            className="w-full resize-none rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* 联系方式 */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              联系邮箱
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="sales@example.com"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              WhatsApp
            </label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) =>
                setForm((f) => ({ ...f, whatsapp: e.target.value }))
              }
              placeholder="+86 138 0000 0000"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Next button */}
      <div className="mt-6 flex justify-end">
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          下一步：生成站点
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 – Generation Progress                                       */
/* ------------------------------------------------------------------ */

function StepGeneration({
  form,
  onComplete,
}: {
  form: FormData;
  onComplete: (result: GenerationResult) => void;
}) {
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const fetchStarted = useRef(false);
  const apiDone = useRef(false);
  const resultRef = useRef<GenerationResult | null>(null);

  useEffect(() => {
    if (fetchStarted.current) return;
    fetchStarted.current = true;

    // Start the API call
    const fetchPromise = fetch("/api/generate-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: GenerationResult) => {
        apiDone.current = true;
        resultRef.current = data;
        // Mark ALL steps as done immediately
        setDoneSet(new Set(GENERATION_STEPS.map((_, i) => i)));
        setActiveIdx(GENERATION_STEPS.length - 1);
        setResult(data);
        setAllDone(true);
      })
      .catch((err) => {
        apiDone.current = true;
        setError(err instanceof Error ? err.message : "生成失败，请重试");
      });

    // Animate through steps while waiting for API
    let currentStep = 0;
    const interval = setInterval(() => {
      if (apiDone.current) {
        clearInterval(interval);
        return;
      }

      // Each step is active for ~2s then marked done, advance to next
      setDoneSet((prev) => {
        const next = new Set(prev);
        if (currentStep > 0) {
          next.add(currentStep - 1);
        }
        return next;
      });

      if (currentStep < GENERATION_STEPS.length - 1) {
        setActiveIdx(currentStep);
        currentStep++;
      }
    }, 2000);

    // Cleanup reference for fetchPromise to avoid unhandled rejection warnings
    void fetchPromise;

    return () => {
      clearInterval(interval);
    };
  }, [form]);

  const handleRetry = () => {
    fetchStarted.current = false;
    apiDone.current = false;
    resultRef.current = null;
    setDoneSet(new Set());
    setActiveIdx(0);
    setAllDone(false);
    setError(null);
    setResult(null);
    // Re-trigger by forcing a re-render; the effect will run again since fetchStarted is reset
    // We need a state change to trigger re-render
    setActiveIdx(0);
    // Manually re-run the fetch
    fetchStarted.current = true;

    fetch("/api/generate-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: GenerationResult) => {
        apiDone.current = true;
        resultRef.current = data;
        setDoneSet(new Set(GENERATION_STEPS.map((_, i) => i)));
        setActiveIdx(GENERATION_STEPS.length - 1);
        setResult(data);
        setAllDone(true);
      })
      .catch((err) => {
        apiDone.current = true;
        setError(err instanceof Error ? err.message : "生成失败，请重试");
      });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">AI 生成中</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          正在为你的企业量身打造外贸独立站
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-black/[0.06] bg-white p-6">
        {GENERATION_STEPS.map((step, i) => {
          const done = doneSet.has(i);
          const active = !done && i <= activeIdx;
          const pending = !done && !active;

          return (
            <div
              key={step.name}
              className={`flex items-start gap-3.5 rounded-lg px-4 py-3 transition-colors ${
                done
                  ? "bg-emerald-50/60"
                  : active
                    ? "bg-indigo-50/60"
                    : "bg-transparent"
              }`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${done ? "text-emerald-700" : active ? "text-indigo-700" : "text-gray-400"}`}
                >
                  {step.name}
                </p>
                <p
                  className={`text-xs ${done ? "text-emerald-600/70" : active ? "text-indigo-500/70" : "text-gray-300"}`}
                >
                  {step.description}
                </p>
              </div>
              {done && (
                <span className="mt-0.5 text-xs font-medium text-emerald-600">
                  完成
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">生成失败</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            重试
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Completion state */}
      {allDone && result && (
        <div className="mt-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">站点生成完成！</p>
          <p className="mt-1 text-sm text-gray-500">
            你的外贸独立站已准备就绪，点击预览查看效果
          </p>
          <button
            onClick={() => onComplete(result)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            预览站点
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 – Preview & Publish                                         */
/* ------------------------------------------------------------------ */

function StepPreview({
  form,
  result,
  onBack,
}: {
  form: FormData;
  result: GenerationResult;
  onBack: () => void;
}) {
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { siteData, subdomain, siteId } = result;
  const siteUrl = `${subdomain}.tradex.com`;

  if (published) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center rounded-xl border border-black/[0.06] bg-white px-6 py-16 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">你的站点已上线！</h2>
          <p className="mt-2 text-sm text-gray-500">
            站点已发布到全球 CDN，预计 1-2 分钟内全球可访问
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-5 py-3 text-sm">
            <Globe className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-gray-900">{siteUrl}</span>
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>企微通知已推送</span>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href={`/site/${subdomain}`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              访问站点
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              返回工作台
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">预览与发布</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          检查生成效果，满意后一键发布上线
        </p>
      </div>

      {/* Browser frame */}
      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-lg">
        {/* Chrome bar */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs text-gray-500 shadow-inner ring-1 ring-gray-200/60">
            <Globe className="h-3 w-3" />
            <span>{siteUrl}</span>
          </div>
        </div>

        {/* Mock site content */}
        <div className="divide-y divide-gray-100">
          {/* Hero */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-16 text-center text-white">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-200">
              {siteData.hero.tagline}
            </p>
            <h3 className="text-3xl font-bold">
              {siteData.hero.headline}
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-indigo-100">
              {siteData.hero.subheadline}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <span className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600">
                {siteData.hero.cta_primary}
              </span>
              <span className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white">
                {siteData.hero.cta_secondary}
              </span>
            </div>
          </div>

          {/* Product grid */}
          <div className="px-8 py-10">
            <h4 className="mb-1 text-center text-lg font-bold text-gray-900">
              Our Products
            </h4>
            <p className="mb-6 text-center text-xs text-gray-500">
              Industry-leading injection molding machines
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {siteData.products.map((product) => (
                <div
                  key={product.name}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100">
                    <Globe className="h-7 w-7 text-indigo-500" />
                  </div>
                  <p className="text-center text-sm font-medium text-gray-800">
                    {product.name}
                  </p>
                  <p className="mt-1 text-center text-xs text-gray-500">
                    {product.description}
                  </p>
                  {product.specs.length > 0 && (
                    <table className="mt-3 w-full text-xs">
                      <tbody>
                        {product.specs.map((spec) => (
                          <tr key={spec.label} className="border-t border-gray-100">
                            <td className="py-1 pr-2 font-medium text-gray-600">
                              {spec.label}
                            </td>
                            <td className="py-1 text-right text-gray-500">
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-gray-50 px-8 py-10">
            <h4 className="mb-6 text-center text-lg font-bold text-gray-900">
              Why Choose Us
            </h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {siteData.why_us.map((item) => (
                <div key={item.title} className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <Check className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-lg font-bold text-indigo-600">
                    {item.stat}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="px-8 py-10">
            <h4 className="mb-4 text-center text-lg font-bold text-gray-900">
              {siteData.about.headline}
            </h4>
            <div className="mx-auto max-w-2xl space-y-3">
              {siteData.about.paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-gray-600">
                  {p}
                </p>
              ))}
            </div>
            {siteData.about.certifications.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {siteData.about.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* FAQ */}
          {siteData.faq.length > 0 && (
            <div className="px-8 py-10">
              <h4 className="mb-6 text-center text-lg font-bold text-gray-900">
                Frequently Asked Questions
              </h4>
              <div className="mx-auto max-w-2xl space-y-2">
                {siteData.faq.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-100"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                    >
                      <span>{item.question}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-600">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RFQ form preview */}
          <div className="px-8 py-10">
            <h4 className="mb-1 text-center text-lg font-bold text-gray-900">
              Get a Free Quote
            </h4>
            <p className="mb-6 text-center text-xs text-gray-500">
              Fill in the form and our team will respond within 24 hours
            </p>
            <div className="mx-auto grid max-w-md gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-400">
                Your Name
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-400">
                Email Address
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-400">
                Product Interest
              </div>
              <div className="h-20 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-400">
                Your Message
              </div>
              <span className="rounded-lg bg-indigo-600 py-2.5 text-center text-xs font-semibold text-white">
                Submit Inquiry
              </span>
            </div>
          </div>

          {/* Contact footer */}
          <div className="bg-gray-900 px-8 py-6 text-center text-xs text-gray-400">
            <p className="font-medium text-white">
              {form.companyEnName || "Your Company"}
            </p>
            {form.email && <p className="mt-1">{form.email}</p>}
            {form.whatsapp && <p className="mt-0.5">WhatsApp: {form.whatsapp}</p>}
            <p className="mt-3 text-gray-500">
              &copy; 2026 {form.companyEnName || "Your Company"}. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          返回编辑
        </button>
        <button
          disabled={publishing}
          onClick={async () => {
            if (siteId) {
              setPublishing(true);
              try {
                await fetch("/api/sites/publish", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ siteId }),
                });
              } catch {}
              setPublishing(false);
            }
            setPublished(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {publishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              发布中...
            </>
          ) : (
            <>
              发布站点
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function BuildPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    companyName: "",
    companyEnName: "",
    products: [],
    markets: [],
    sellingPoints: "",
    email: "",
    whatsapp: "",
  });
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const goToStep = useCallback((s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="py-2">
      <StepIndicator current={step} />

      {step === 1 && (
        <StepForm form={form} setForm={setForm} onNext={() => goToStep(2)} />
      )}

      {step === 2 && (
        <StepGeneration
          form={form}
          onComplete={(result) => {
            setGenerationResult(result);
            goToStep(3);
          }}
        />
      )}

      {step === 3 && generationResult && (
        <StepPreview form={form} result={generationResult} onBack={() => goToStep(1)} />
      )}
    </div>
  );
}
