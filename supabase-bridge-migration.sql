-- ============================================
-- TradeX ↔ Factory System Bridge Migration
-- Links factory-digital-archive-agent to TradeX
-- ============================================

-- 1. factory_supplier_links — 工厂 ↔ TradeX 供应商身份映射
CREATE TABLE public.factory_supplier_links (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id      TEXT NOT NULL,                          -- factory-digital-archive-agent factories.id (UUID as text)
  factory_short_id TEXT,                                  -- factories.short_id for QR code lookups
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- TradeX supplier
  factory_name    TEXT,                                   -- Cached factory name
  factory_region  TEXT,                                   -- Cached region for display
  trust_score     DECIMAL(4,2),                           -- Cached trust score from factory system
  trust_dimensions JSONB,                                 -- Cached 5-dimension trust breakdown
  sync_status     TEXT DEFAULT 'linked' CHECK (sync_status IN ('linked', 'syncing', 'synced', 'error')),
  last_synced_at  TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',                     -- Extra factory info (categories, processes, etc.)
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(factory_id),
  UNIQUE(user_id)                                         -- One factory per TradeX supplier account
);

ALTER TABLE public.factory_supplier_links ENABLE ROW LEVEL SECURITY;

-- Suppliers can view their own link
CREATE POLICY "Users can view own factory link"
  ON public.factory_supplier_links FOR SELECT
  USING (auth.uid() = user_id);

-- Service role full access (for bridge API)
CREATE POLICY "Service role full access factory links"
  ON public.factory_supplier_links FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_factory_links_factory ON public.factory_supplier_links(factory_id);
CREATE INDEX idx_factory_links_user ON public.factory_supplier_links(user_id);
CREATE INDEX idx_factory_links_short_id ON public.factory_supplier_links(factory_short_id) WHERE factory_short_id IS NOT NULL;

-- 2. Add factory_id reference to supply_products for provenance tracking
ALTER TABLE public.supply_products ADD COLUMN IF NOT EXISTS factory_id TEXT;
ALTER TABLE public.supply_products ADD COLUMN IF NOT EXISTS factory_product_id TEXT;
ALTER TABLE public.supply_products ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'factory_sync', 'import'));

CREATE INDEX idx_supply_products_factory ON public.supply_products(factory_id) WHERE factory_id IS NOT NULL;
CREATE INDEX idx_supply_products_factory_product ON public.supply_products(factory_product_id) WHERE factory_product_id IS NOT NULL;

-- 3. bridge_sync_logs — 跨系统同步日志
CREATE TABLE public.bridge_sync_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  direction       TEXT NOT NULL CHECK (direction IN ('factory_to_tradex', 'tradex_to_factory')),
  entity_type     TEXT NOT NULL,                          -- 'product', 'factory_link', 'adoption', 'trust_score'
  entity_id       TEXT,                                   -- ID of the entity being synced
  action          TEXT NOT NULL,                          -- 'create', 'update', 'delete', 'sync'
  status          TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  details         JSONB DEFAULT '{}',                     -- Sync details and any errors
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bridge_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access sync logs" ON public.bridge_sync_logs FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_bridge_sync_logs_entity ON public.bridge_sync_logs(entity_type, entity_id, created_at DESC);

-- 4. Updated timestamp trigger for factory_supplier_links
CREATE OR REPLACE FUNCTION update_factory_link_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_factory_link_updated
  BEFORE UPDATE ON public.factory_supplier_links
  FOR EACH ROW EXECUTE FUNCTION update_factory_link_timestamp();
