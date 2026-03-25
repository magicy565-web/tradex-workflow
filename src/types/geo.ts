// GEO Module Types — AI Search Optimization

export interface GeoPage {
  id: string;
  user_id: string;
  page_type: "product" | "factory";
  entity_id: string;
  slug: string;
  status: "draft" | "published" | "archived";

  title: string;
  meta_description?: string;
  hero_content: Record<string, unknown>;
  structured_specs: GeoSpec[];
  trust_signals: GeoTrustSignal[];
  faq: GeoFaqItem[];
  gallery: string[];
  factory_profile: Record<string, unknown>;
  jsonld: Record<string, unknown>;

  content_score: number;
  score_breakdown: Record<string, number>;

  published_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  stats?: GeoPageStats;
}

export interface GeoSpec {
  key: string;
  value: string;
  unit?: string;
}

export interface GeoTrustSignal {
  type: "certification" | "inspection" | "verification" | "award";
  name: string;
  issuer?: string;
  number?: string;
  url?: string;
}

export interface GeoFaqItem {
  question: string;
  answer: string;
}

export interface GeoPageStats {
  total_visits: number;
  ai_visits: number;
  inquiries: number;
}

export interface GeoVisit {
  id: string;
  page_id: string;
  user_id: string;
  source: GeoSource;
  referrer?: string;
  visitor_country?: string;
  is_bot: boolean;
  bot_name?: string;
  utm_source?: string;
  utm_medium?: string;
  visited_at: string;
}

export type GeoSource =
  | "ai_chatgpt"
  | "ai_perplexity"
  | "ai_google"
  | "ai_bing"
  | "organic"
  | "direct"
  | "referral"
  | "other";

export interface GeoInquiry {
  id: string;
  page_id?: string;
  user_id: string;
  visit_id?: string;

  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  country?: string;

  inquiry_type: "wholesale" | "oem" | "odm" | "sample" | "distribution" | "other";
  message?: string;
  quantity_estimate?: string;

  source?: string;
  status: "new" | "contacted" | "quoting" | "converted" | "closed";
  supplier_notes?: string;

  created_at: string;
  updated_at: string;

  // Joined
  page?: GeoPage;
}

export interface GeoDailyStat {
  id: string;
  user_id: string;
  page_id?: string;
  stat_date: string;

  visits_total: number;
  visits_ai_chatgpt: number;
  visits_ai_perplexity: number;
  visits_ai_google: number;
  visits_ai_bing: number;
  visits_organic: number;
  visits_other: number;

  inquiries: number;
  subscribe_clicks: number;
  unique_visitors: number;
}

export interface GeoAnalyticsOverview {
  period_days: number;
  visits_total: number;
  visits_ai: number;
  visits_ai_breakdown: Record<string, number>;
  inquiries_total: number;
  subscribe_clicks: number;
  conversion_rate: number;
  top_pages: { slug: string; title: string; visits: number; inquiries: number }[];
  trend: GeoDailyStat[];
}

export const GEO_PAGE_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export const GEO_INQUIRY_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["contacted", "closed"],
  contacted: ["quoting", "closed"],
  quoting: ["converted", "closed"],
  converted: [],
  closed: ["new"],
};

export const AI_SOURCES: GeoSource[] = [
  "ai_chatgpt",
  "ai_perplexity",
  "ai_google",
  "ai_bing",
];

export const SOURCE_LABELS: Record<GeoSource, string> = {
  ai_chatgpt: "ChatGPT",
  ai_perplexity: "Perplexity",
  ai_google: "Google AI",
  ai_bing: "Bing Copilot",
  organic: "Organic Search",
  direct: "Direct",
  referral: "Referral",
  other: "Other",
};
