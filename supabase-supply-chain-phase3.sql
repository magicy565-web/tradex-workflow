-- ============================================
-- TradeX 分销系统完善 — Phase 3
-- 卖家管理 + 定价与库存 + 退货售后
-- ============================================

-- ========== 1. 卖家管理流程 ==========

-- 1a. 卖家审核状态 & 分级
ALTER TABLE public.shopify_sellers
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'auto_approved'
    CHECK (approval_status IN ('pending', 'approved', 'suspended', 'auto_approved')),
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard'
    CHECK (tier IN ('standard', 'silver', 'gold', 'vip')),
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.0500,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspend_reason TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX idx_sellers_approval ON public.shopify_sellers(approval_status) WHERE approval_status IN ('pending', 'suspended');

-- ========== 2. 定价与库存 ==========

-- 2a. 阶梯定价表
CREATE TABLE public.supply_price_tiers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES public.supply_products(id) ON DELETE CASCADE,
  min_quantity    INT NOT NULL,
  max_quantity    INT,                              -- NULL = 无上限
  unit_price      DECIMAL(10,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supply_price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own product tiers"
  ON public.supply_price_tiers FOR ALL
  USING (
    product_id IN (SELECT id FROM public.supply_products WHERE user_id = auth.uid())
  )
  WITH CHECK (
    product_id IN (SELECT id FROM public.supply_products WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role access price tiers"
  ON public.supply_price_tiers FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_price_tiers_product ON public.supply_price_tiers(product_id, min_quantity);

-- 2b. 库存预警配置
ALTER TABLE public.supply_products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS auto_pause_on_zero BOOLEAN DEFAULT false;

-- 2c. 运费模板
CREATE TABLE public.supply_shipping_templates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  is_default      BOOLEAN DEFAULT false,
  zones           JSONB NOT NULL DEFAULT '[]',
  -- zones: [{name, countries[], methods: [{name, price, min_days, max_days, free_above}]}]
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supply_shipping_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shipping templates"
  ON public.supply_shipping_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_shipping_templates_user ON public.supply_shipping_templates(user_id);

-- 2d. 产品关联运费模板
ALTER TABLE public.supply_products
  ADD COLUMN IF NOT EXISTS shipping_template_id UUID REFERENCES public.supply_shipping_templates(id);

-- ========== 3. 退货与售后 ==========

-- 3a. 退货/退款表
CREATE TABLE public.supply_returns (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number   TEXT NOT NULL UNIQUE,
  order_id        UUID NOT NULL REFERENCES public.supply_orders(id),
  supplier_id     UUID NOT NULL REFERENCES auth.users(id),
  seller_id       UUID NOT NULL REFERENCES public.shopify_sellers(id),
  product_id      UUID NOT NULL REFERENCES public.supply_products(id),

  -- 退货类型
  type            TEXT NOT NULL CHECK (type IN ('refund_only', 'return_refund', 'exchange')),
  reason          TEXT NOT NULL,
  description     TEXT,
  evidence_images TEXT[] DEFAULT '{}',

  -- 金额
  quantity        INT NOT NULL DEFAULT 1,
  refund_amount   DECIMAL(10,2) NOT NULL,
  shipping_cost   DECIMAL(10,2) DEFAULT 0,

  -- 退货物流（买家寄回）
  return_tracking_company TEXT,
  return_tracking_number  TEXT,
  return_tracking_url     TEXT,
  return_shipped_at       TIMESTAMPTZ,
  return_received_at      TIMESTAMPTZ,

  -- 状态机: requested → approved → shipped_back → received → refunded
  --                   → rejected
  --                   → cancelled (by seller)
  status          TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'rejected', 'shipped_back', 'received', 'refunded', 'cancelled')),

  -- 处理记录
  reject_reason   TEXT,
  refunded_at     TIMESTAMPTZ,
  notes           TEXT,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supply_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers manage own returns"
  ON public.supply_returns FOR ALL
  USING (auth.uid() = supplier_id)
  WITH CHECK (auth.uid() = supplier_id);

CREATE POLICY "Service role full access returns"
  ON public.supply_returns FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_returns_supplier ON public.supply_returns(supplier_id, status, created_at DESC);
CREATE INDEX idx_returns_order ON public.supply_returns(order_id);
CREATE INDEX idx_returns_seller ON public.supply_returns(seller_id, created_at DESC);

-- 3b. 退货编号生成函数
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  seq INT;
BEGIN
  today := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(return_number FROM 'RT-' || today || '-(\d+)') AS INT)
  ), 0) + 1
  INTO seq
  FROM public.supply_returns
  WHERE return_number LIKE 'RT-' || today || '-%';
  RETURN 'RT-' || today || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 3c. 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_return_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_return_updated
  BEFORE UPDATE ON public.supply_returns
  FOR EACH ROW EXECUTE FUNCTION update_return_timestamp();

-- 3d. 供应商设置表（统一管理供应商偏好）
CREATE TABLE public.supply_settings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  auto_confirm_orders   BOOLEAN DEFAULT false,
  auto_approve_returns  BOOLEAN DEFAULT false,
  return_window_days    INT DEFAULT 15,
  default_commission    DECIMAL(5,4) DEFAULT 0.0500,
  require_seller_approval BOOLEAN DEFAULT false,
  low_stock_notify      BOOLEAN DEFAULT true,
  wecom_webhook_url     TEXT,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supply_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON public.supply_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
