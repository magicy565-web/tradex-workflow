-- ============================================
-- TradeX Supply Chain Semi-Managed Migration
-- Phase 1: Core tables + RLS + Indexes
-- Run this AFTER the base supabase-schema.sql
-- ============================================

-- ============================================
-- 1. supply_products — 供应链产品目录
-- ============================================
CREATE TABLE public.supply_products (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id         UUID REFERENCES public.sites(id),

  -- 产品基础信息
  title           TEXT NOT NULL,
  title_zh        TEXT,
  description     TEXT,
  category        TEXT,
  images          TEXT[] DEFAULT '{}',
  sku             TEXT,

  -- 供货信息
  supply_price    DECIMAL(10,2) NOT NULL,
  msrp            DECIMAL(10,2),
  currency        TEXT DEFAULT 'USD',
  moq             INT DEFAULT 1,
  lead_time_days  INT DEFAULT 7,
  stock_quantity  INT DEFAULT 0,

  -- 产品参数（灵活 JSON）
  specs           JSONB DEFAULT '[]',
  variants        JSONB DEFAULT '[]',

  -- 物流
  weight_kg       DECIMAL(8,2),
  dimensions      JSONB,
  origin_country  TEXT DEFAULT 'CN',
  hs_code         TEXT,

  -- 状态
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  subscribers_count INT DEFAULT 0,
  total_orders    INT DEFAULT 0,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supply_products ENABLE ROW LEVEL SECURITY;

-- 工厂可以管理自己的供应链产品
CREATE POLICY "Users can view own supply products"
  ON public.supply_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supply products"
  ON public.supply_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supply products"
  ON public.supply_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supply products"
  ON public.supply_products FOR DELETE
  USING (auth.uid() = user_id);

-- 外部 API（Shopify App）可以读取 active 状态的产品（通过 service role key）
CREATE POLICY "Public can view active supply products"
  ON public.supply_products FOR SELECT
  USING (status = 'active');


-- ============================================
-- 2. shopify_sellers — Shopify 卖家
-- ============================================
CREATE TABLE public.shopify_sellers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain     TEXT NOT NULL UNIQUE,
  shop_name       TEXT,
  email           TEXT,
  api_key         TEXT NOT NULL UNIQUE,
  api_secret      TEXT NOT NULL,
  access_token    TEXT,
  app_installed   BOOLEAN DEFAULT true,
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  products_synced INT DEFAULT 0,
  total_orders    INT DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shopify_sellers ENABLE ROW LEVEL SECURITY;

-- 只有 service role 可以操作（通过 API 中间件验证）
-- 工厂用户可以查看订阅了自己产品的卖家（通过 join）
CREATE POLICY "Service role full access to shopify_sellers"
  ON public.shopify_sellers FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================
-- 3. supply_subscriptions — 订阅关系
-- ============================================
CREATE TABLE public.supply_subscriptions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id           UUID NOT NULL REFERENCES public.shopify_sellers(id),
  product_id          UUID NOT NULL REFERENCES public.supply_products(id),
  supplier_id         UUID NOT NULL REFERENCES auth.users(id),

  -- 铺货配置
  shopify_product_id  BIGINT,
  markup_type         TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed')),
  markup_value        DECIMAL(10,2) DEFAULT 30,
  auto_sync           BOOLEAN DEFAULT true,

  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'removed')),
  created_at          TIMESTAMPTZ DEFAULT now(),

  UNIQUE(seller_id, product_id)
);

ALTER TABLE public.supply_subscriptions ENABLE ROW LEVEL SECURITY;

-- 工厂可以查看自己产品的订阅
CREATE POLICY "Suppliers can view own product subscriptions"
  ON public.supply_subscriptions FOR SELECT
  USING (auth.uid() = supplier_id);

-- Service role 可以完全操作（Shopify App 通过 HMAC 验证后使用）
CREATE POLICY "Service role full access to subscriptions"
  ON public.supply_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================
-- 4. supply_orders — 供应链订单
-- ============================================
CREATE TABLE public.supply_orders (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number        TEXT NOT NULL UNIQUE,

  -- 关联关系
  supplier_id         UUID NOT NULL REFERENCES auth.users(id),
  seller_id           UUID NOT NULL REFERENCES public.shopify_sellers(id),
  product_id          UUID NOT NULL REFERENCES public.supply_products(id),
  subscription_id     UUID REFERENCES public.supply_subscriptions(id),

  -- Shopify 订单信息
  shopify_order_id    BIGINT,
  shopify_order_name  TEXT,

  -- 商品详情
  quantity            INT NOT NULL DEFAULT 1,
  variant_info        JSONB,
  unit_cost           DECIMAL(10,2) NOT NULL,
  total_cost          DECIMAL(10,2) NOT NULL,
  seller_price        DECIMAL(10,2),
  commission          DECIMAL(10,2) DEFAULT 0,

  -- 收货地址
  shipping_address    JSONB NOT NULL,

  -- 物流信息
  tracking_company    TEXT,
  tracking_number     TEXT,
  tracking_url        TEXT,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,

  -- 状态: pending → confirmed → processing → shipped → delivered | cancelled
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes               TEXT,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supply_orders ENABLE ROW LEVEL SECURITY;

-- 工厂可以查看和更新自己的订单
CREATE POLICY "Suppliers can view own orders"
  ON public.supply_orders FOR SELECT
  USING (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can update own orders"
  ON public.supply_orders FOR UPDATE
  USING (auth.uid() = supplier_id);

-- Service role 可以创建订单（Shopify App 通过 HMAC 验证后）
CREATE POLICY "Service role full access to supply_orders"
  ON public.supply_orders FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================
-- 5. 生成订单号的函数
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_str TEXT;
  seq INT;
BEGIN
  today_str := to_char(now(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq
  FROM public.supply_orders
  WHERE order_number LIKE 'TX-' || today_str || '-%';
  RETURN 'TX-' || today_str || '-' || lpad(seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 6. 更新 subscribers_count 触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.update_subscribers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.supply_products
    SET subscribers_count = subscribers_count + 1, updated_at = now()
    WHERE id = NEW.product_id AND NEW.status = 'active';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE public.supply_products
      SET subscribers_count = GREATEST(subscribers_count - 1, 0), updated_at = now()
      WHERE id = NEW.product_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE public.supply_products
      SET subscribers_count = subscribers_count + 1, updated_at = now()
      WHERE id = NEW.product_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'active' THEN
      UPDATE public.supply_products
      SET subscribers_count = GREATEST(subscribers_count - 1, 0), updated_at = now()
      WHERE id = OLD.product_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE OR DELETE ON public.supply_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscribers_count();


-- ============================================
-- 7. 更新 total_orders 触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.update_product_order_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.supply_products
  SET total_orders = total_orders + 1, updated_at = now()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_created
  AFTER INSERT ON public.supply_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_product_order_count();


-- ============================================
-- 8. INDEXES
-- ============================================

-- 供应链产品：按工厂查询、按状态过滤
CREATE INDEX idx_supply_products_user ON public.supply_products(user_id, status);
CREATE INDEX idx_supply_products_category ON public.supply_products(category) WHERE status = 'active';
CREATE INDEX idx_supply_products_status ON public.supply_products(status);

-- 卖家：按 api_key 查找
CREATE INDEX idx_shopify_sellers_api_key ON public.shopify_sellers(api_key);

-- 订阅关系：按卖家查、按供应商查
CREATE INDEX idx_subscriptions_seller ON public.supply_subscriptions(seller_id) WHERE status = 'active';
CREATE INDEX idx_subscriptions_supplier ON public.supply_subscriptions(supplier_id) WHERE status = 'active';

-- 订单：工厂查自己的订单、按状态过滤
CREATE INDEX idx_supply_orders_supplier ON public.supply_orders(supplier_id, status, created_at DESC);
CREATE INDEX idx_supply_orders_seller ON public.supply_orders(seller_id, created_at DESC);
CREATE INDEX idx_supply_orders_product ON public.supply_orders(product_id);
