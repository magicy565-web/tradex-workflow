/**
 * GEO Utilities — Source classification, content scoring, Schema.org generation
 */

import type { GeoSource, GeoSpec, GeoTrustSignal, GeoFaqItem } from "@/types/geo";

// ── Source Classification ──────────────────────────────────────

const AI_REFERRER_MAP: Record<string, GeoSource> = {
  "chatgpt.com": "ai_chatgpt",
  "chat.openai.com": "ai_chatgpt",
  "perplexity.ai": "ai_perplexity",
  "copilot.microsoft.com": "ai_bing",
  "bing.com/chat": "ai_bing",
};

const AI_BOT_MAP: Record<string, { source: GeoSource; name: string }> = {
  GPTBot: { source: "ai_chatgpt", name: "GPTBot" },
  "ChatGPT-User": { source: "ai_chatgpt", name: "ChatGPT-User" },
  PerplexityBot: { source: "ai_perplexity", name: "PerplexityBot" },
  "Google-Extended": { source: "ai_google", name: "Google-Extended" },
  "Applebot-Extended": { source: "ai_google", name: "Applebot-Extended" },
};

export function classifySource(
  referrer: string | null,
  userAgent: string
): { source: GeoSource; isBot: boolean; botName?: string } {
  // 1. AI bot detection
  for (const [sig, info] of Object.entries(AI_BOT_MAP)) {
    if (userAgent.includes(sig)) {
      return { source: info.source, isBot: true, botName: info.name };
    }
  }

  if (!referrer) return { source: "direct", isBot: false };

  // 2. AI search referrer
  for (const [domain, source] of Object.entries(AI_REFERRER_MAP)) {
    if (referrer.includes(domain)) {
      return { source, isBot: false };
    }
  }

  // 3. Organic search
  if (
    referrer.includes("google.com") ||
    referrer.includes("bing.com") ||
    referrer.includes("duckduckgo.com") ||
    referrer.includes("yahoo.com")
  ) {
    return { source: "organic", isBot: false };
  }

  // 4. Has referrer but not search
  if (referrer.length > 0) {
    return { source: "referral", isBot: false };
  }

  return { source: "other", isBot: false };
}

// ── Content Score ──────────────────────────────────────────────

interface ScoreInput {
  title: string;
  meta_description?: string;
  structured_specs: GeoSpec[];
  trust_signals: GeoTrustSignal[];
  faq: GeoFaqItem[];
  gallery: string[];
  factory_profile: Record<string, unknown>;
  page_type: "product" | "factory";
}

export function calculateContentScore(input: ScoreInput): {
  total: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};

  // Title & description (15 pts)
  let titleScore = 0;
  if (input.title && input.title.length >= 10) titleScore += 8;
  else if (input.title) titleScore += 4;
  if (input.meta_description && input.meta_description.length >= 50) titleScore += 7;
  else if (input.meta_description) titleScore += 3;
  breakdown.title_description = titleScore;

  // Structured specs (25 pts)
  const specCount = input.structured_specs.length;
  if (specCount >= 10) breakdown.specs = 25;
  else if (specCount >= 5) breakdown.specs = 15;
  else if (specCount >= 2) breakdown.specs = 8;
  else breakdown.specs = 0;

  // Trust signals (20 pts)
  const trustCount = input.trust_signals.length;
  if (trustCount >= 3) breakdown.trust_signals = 20;
  else if (trustCount >= 1) breakdown.trust_signals = 10;
  else breakdown.trust_signals = 0;

  // FAQ (20 pts)
  const faqCount = input.faq.length;
  if (faqCount >= 5) breakdown.faq = 20;
  else if (faqCount >= 3) breakdown.faq = 12;
  else if (faqCount >= 1) breakdown.faq = 5;
  else breakdown.faq = 0;

  // Gallery (10 pts)
  const imgCount = input.gallery.length;
  if (imgCount >= 5) breakdown.gallery = 10;
  else if (imgCount >= 2) breakdown.gallery = 6;
  else if (imgCount >= 1) breakdown.gallery = 3;
  else breakdown.gallery = 0;

  // Factory profile (10 pts, only for factory pages or if linked)
  if (input.page_type === "factory") {
    const profile = input.factory_profile;
    let factoryScore = 0;
    if (profile.annual_output) factoryScore += 3;
    if (profile.established_year) factoryScore += 2;
    if (profile.workers) factoryScore += 2;
    if (profile.production_lines) factoryScore += 3;
    breakdown.factory_profile = Math.min(factoryScore, 10);
  } else {
    breakdown.factory_profile = 10; // product pages get full marks here
  }

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total: Math.min(total, 100), breakdown };
}

// ── Content Optimization Hints ────────────────────────────────

export interface ContentHint {
  dimension: string;
  label: string;
  current: number;
  max: number;
  suggestion: string;
  impact: number; // potential score increase
}

/**
 * Generate actionable content optimization hints based on score breakdown.
 */
export function generateContentHints(input: ScoreInput, breakdown: Record<string, number>): ContentHint[] {
  const hints: ContentHint[] = [];

  // Title & description hints
  if (breakdown.title_description < 15) {
    if (!input.title || input.title.length < 10) {
      hints.push({
        dimension: "title_description",
        label: "标题",
        current: breakdown.title_description,
        max: 15,
        suggestion: "补充标题至 10 字以上，包含核心产品关键词",
        impact: 8 - (input.title ? 4 : 0),
      });
    }
    if (!input.meta_description || input.meta_description.length < 50) {
      hints.push({
        dimension: "title_description",
        label: "描述",
        current: breakdown.title_description,
        max: 15,
        suggestion: "补充描述至 50 字以上，概括产品核心卖点和规格",
        impact: 7 - (input.meta_description ? 3 : 0),
      });
    }
  }

  // Specs hints
  if (breakdown.specs < 25) {
    const specCount = input.structured_specs.length;
    const needed = specCount < 2 ? 5 : specCount < 5 ? 10 : 10;
    const gain = specCount < 2 ? 15 : specCount < 5 ? 10 : 10;
    hints.push({
      dimension: "specs",
      label: "规格参数",
      current: breakdown.specs,
      max: 25,
      suggestion: `当前 ${specCount} 项规格，补充至 ${needed} 项可提升 +${gain} 分（如材质、尺寸、包装方式等）`,
      impact: gain,
    });
  }

  // Trust signals hints
  if (breakdown.trust_signals < 20) {
    const trustCount = input.trust_signals.length;
    hints.push({
      dimension: "trust_signals",
      label: "认证资质",
      current: breakdown.trust_signals,
      max: 20,
      suggestion: trustCount === 0
        ? "添加至少 1 项认证（如 CE、ISO、FDA 等）可提升 +10 分"
        : `当前 ${trustCount} 项认证，补充至 3 项可提升 +${20 - breakdown.trust_signals} 分`,
      impact: 20 - breakdown.trust_signals,
    });
  }

  // FAQ hints
  if (breakdown.faq < 20) {
    const faqCount = input.faq.length;
    hints.push({
      dimension: "faq",
      label: "常见问题",
      current: breakdown.faq,
      max: 20,
      suggestion: faqCount === 0
        ? "添加 3-5 条 FAQ 可提升 +12 分（AI 搜索引擎优先引用 FAQ 内容）"
        : `当前 ${faqCount} 条 FAQ，补充至 ${faqCount < 3 ? 3 : 5} 条可提升 +${20 - breakdown.faq} 分`,
      impact: 20 - breakdown.faq,
    });
  }

  // Gallery hints
  if (breakdown.gallery < 10) {
    const imgCount = input.gallery.length;
    hints.push({
      dimension: "gallery",
      label: "产品图片",
      current: breakdown.gallery,
      max: 10,
      suggestion: imgCount === 0
        ? "添加至少 2 张产品图可提升 +6 分"
        : `当前 ${imgCount} 张图片，补充至 5 张可提升 +${10 - breakdown.gallery} 分`,
      impact: 10 - breakdown.gallery,
    });
  }

  // Factory profile hints (factory pages only)
  if (input.page_type === "factory" && breakdown.factory_profile < 10) {
    const profile = input.factory_profile;
    const missing: string[] = [];
    if (!profile.annual_output) missing.push("年产量");
    if (!profile.established_year) missing.push("成立年份");
    if (!profile.workers) missing.push("员工人数");
    if (!profile.production_lines) missing.push("生产线数量");
    if (missing.length > 0) {
      hints.push({
        dimension: "factory_profile",
        label: "工厂信息",
        current: breakdown.factory_profile,
        max: 10,
        suggestion: `补充以下工厂信息可提升评分: ${missing.join("、")}`,
        impact: 10 - breakdown.factory_profile,
      });
    }
  }

  // Sort by impact descending
  hints.sort((a, b) => b.impact - a.impact);

  return hints;
}

// ── Schema.org JSON-LD Generation ──────────────────────────────

export function generateProductJsonLd(data: {
  title: string;
  description: string;
  specs: GeoSpec[];
  trustSignals: GeoTrustSignal[];
  faq: GeoFaqItem[];
  priceRange?: { low: number; high: number; currency: string };
  manufacturer?: { name: string; country: string };
  slug: string;
  baseUrl: string;
}): Record<string, unknown> {
  const jsonld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.title,
    description: data.description,
    url: `${data.baseUrl}/s/p/${data.slug}`,
    additionalProperty: data.specs.map((s) => ({
      "@type": "PropertyValue",
      name: s.key,
      value: s.unit ? `${s.value} ${s.unit}` : s.value,
    })),
  };

  if (data.priceRange) {
    jsonld.offers = {
      "@type": "AggregateOffer",
      priceCurrency: data.priceRange.currency,
      lowPrice: String(data.priceRange.low),
      highPrice: String(data.priceRange.high),
      availability: "https://schema.org/InStock",
    };
  }

  if (data.manufacturer) {
    jsonld.manufacturer = {
      "@type": "Organization",
      name: data.manufacturer.name,
      address: {
        "@type": "PostalAddress",
        addressCountry: data.manufacturer.country,
      },
    };
  }

  if (data.trustSignals.length > 0) {
    jsonld.hasCredential = data.trustSignals.map((t) => ({
      "@type": "EducationalOccupationalCredential",
      name: t.name,
      credentialCategory: t.type,
      ...(t.issuer ? { recognizedBy: { "@type": "Organization", name: t.issuer } } : {}),
    }));
  }

  return jsonld;
}

export function generateFaqJsonLd(
  faq: GeoFaqItem[]
): Record<string, unknown> | null {
  if (faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function generateFactoryJsonLd(data: {
  name: string;
  description: string;
  country: string;
  profile: Record<string, unknown>;
  trustSignals: GeoTrustSignal[];
  slug: string;
  baseUrl: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    description: data.description,
    url: `${data.baseUrl}/s/f/${data.slug}`,
    address: {
      "@type": "PostalAddress",
      addressCountry: data.country,
    },
    ...(data.profile.established_year
      ? { foundingDate: String(data.profile.established_year) }
      : {}),
    ...(data.profile.workers
      ? { numberOfEmployees: { "@type": "QuantitativeValue", value: data.profile.workers } }
      : {}),
    ...(data.trustSignals.length > 0
      ? {
          hasCredential: data.trustSignals.map((t) => ({
            "@type": "EducationalOccupationalCredential",
            name: t.name,
            ...(t.issuer ? { recognizedBy: { "@type": "Organization", name: t.issuer } } : {}),
          })),
        }
      : {}),
  };
}

// ── IP Hashing ─────────────────────────────────────────────────

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "tradex-geo-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

// ── Slug Generation ────────────────────────────────────────────

export function generateSlug(title: string, entityId: string): string {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length < 3) {
    slug = "page-" + entityId.slice(0, 8);
  }

  return slug.slice(0, 80);
}
