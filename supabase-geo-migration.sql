-- ============================================================
-- GEO/AEO Module — AI Search Optimization for Suppliers
-- ============================================================
-- Enables suppliers to generate public product/factory pages
-- optimized for AI search engines (ChatGPT, Perplexity, etc.)
-- and track traffic, inquiries, and conversions from AI sources.
-- ============================================================

-- 1. Public Pages (one per product or factory)
CREATE TABLE public.geo_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('product', 'factory')),
  entity_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Content (auto-generated + user-editable)
  title TEXT NOT NULL,
  meta_description TEXT,
  hero_content JSONB DEFAULT '{}',
  structured_specs JSONB DEFAULT '[]',
  trust_signals JSONB DEFAULT '[]',
  faq JSONB DEFAULT '[]',
  gallery JSONB DEFAULT '[]',
  factory_profile JSONB DEFAULT '{}',
  jsonld JSONB DEFAULT '{}',

  -- Content quality score
  content_score INT DEFAULT 0 CHECK (content_score >= 0 AND content_score <= 100),
  score_breakdown JSONB DEFAULT '{}',

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.geo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own geo_pages"
  ON public.geo_pages FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Published pages are public"
  ON public.geo_pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "Service role full access on geo_pages"
  ON public.geo_pages FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_geo_pages_slug ON public.geo_pages(slug);
CREATE INDEX idx_geo_pages_user_status ON public.geo_pages(user_id, status);
CREATE INDEX idx_geo_pages_entity ON public.geo_pages(entity_id);
CREATE INDEX idx_geo_pages_type ON public.geo_pages(page_type, status);

-- 2. Page Visits (traffic tracking with AI source attribution)
CREATE TABLE public.geo_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.geo_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  source TEXT NOT NULL DEFAULT 'other'
    CHECK (source IN (
      'ai_chatgpt', 'ai_perplexity', 'ai_google', 'ai_bing',
      'organic', 'direct', 'referral', 'other'
    )),
  referrer TEXT,
  user_agent TEXT,

  visitor_country TEXT,
  visitor_ip_hash TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  bot_name TEXT,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  visited_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.geo_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own geo_visits"
  ON public.geo_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on geo_visits"
  ON public.geo_visits FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_geo_visits_page ON public.geo_visits(page_id, visited_at DESC);
CREATE INDEX idx_geo_visits_user_source ON public.geo_visits(user_id, source, visited_at DESC);
CREATE INDEX idx_geo_visits_date ON public.geo_visits(visited_at DESC);

-- 3. Inquiries (leads from public pages)
CREATE TABLE public.geo_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES public.geo_pages(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  visit_id UUID REFERENCES public.geo_visits(id) ON DELETE SET NULL,

  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,

  inquiry_type TEXT DEFAULT 'wholesale'
    CHECK (inquiry_type IN ('wholesale', 'oem', 'odm', 'sample', 'distribution', 'other')),
  message TEXT,
  quantity_estimate TEXT,

  source TEXT DEFAULT 'other',
  status TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'quoting', 'converted', 'closed')),
  supplier_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.geo_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own geo_inquiries"
  ON public.geo_inquiries FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on geo_inquiries"
  ON public.geo_inquiries FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_geo_inquiries_user ON public.geo_inquiries(user_id, status, created_at DESC);
CREATE INDEX idx_geo_inquiries_page ON public.geo_inquiries(page_id, created_at DESC);

-- 4. Tracking Events (fine-grained behavior)
CREATE TABLE public.geo_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.geo_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  visit_id UUID REFERENCES public.geo_visits(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'page_view', 'cta_click', 'inquiry_submit',
      'subscribe_click', 'sample_request', 'faq_expand'
    )),
  event_data JSONB DEFAULT '{}',
  source TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.geo_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own geo_events"
  ON public.geo_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on geo_events"
  ON public.geo_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_geo_events_user ON public.geo_events(user_id, event_type, created_at DESC);
CREATE INDEX idx_geo_events_page ON public.geo_events(page_id, created_at DESC);

-- 5. Daily Stats (aggregated for dashboard performance)
CREATE TABLE public.geo_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_id UUID REFERENCES public.geo_pages(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,

  visits_total INT DEFAULT 0,
  visits_ai_chatgpt INT DEFAULT 0,
  visits_ai_perplexity INT DEFAULT 0,
  visits_ai_google INT DEFAULT 0,
  visits_ai_bing INT DEFAULT 0,
  visits_organic INT DEFAULT 0,
  visits_other INT DEFAULT 0,

  inquiries INT DEFAULT 0,
  subscribe_clicks INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,

  UNIQUE(user_id, page_id, stat_date)
);

ALTER TABLE public.geo_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own geo_daily_stats"
  ON public.geo_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on geo_daily_stats"
  ON public.geo_daily_stats FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_geo_daily_user ON public.geo_daily_stats(user_id, stat_date DESC);

-- 6. Helper: generate slug from text
CREATE OR REPLACE FUNCTION generate_geo_slug(title TEXT, entity_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF length(base_slug) < 3 THEN
    base_slug := 'page-' || left(entity_id::text, 8);
  END IF;
  base_slug := left(base_slug, 80);
  final_slug := base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.geo_pages WHERE slug = final_slug);
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
