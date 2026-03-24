-- ============================================
-- TradeX Supply Chain Phase 2 Migration
-- Webhook logs + Notification center
-- ============================================

-- 1. supply_webhook_logs — Webhook 推送日志
CREATE TABLE public.supply_webhook_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id       UUID NOT NULL REFERENCES public.shopify_sellers(id),
  event           TEXT NOT NULL,
  payload         JSONB NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  response_status INT,
  response_body   TEXT,
  attempts        INT DEFAULT 0,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  sent_at         TIMESTAMPTZ
);

ALTER TABLE public.supply_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access webhook logs" ON public.supply_webhook_logs FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_webhook_logs_seller ON public.supply_webhook_logs(seller_id, created_at DESC);
CREATE INDEX idx_webhook_logs_status ON public.supply_webhook_logs(status) WHERE status IN ('pending', 'retrying');

-- 2. supply_notifications — 站内通知中心
CREATE TABLE public.supply_notifications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  data            JSONB DEFAULT '{}',
  read            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supply_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.supply_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.supply_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role insert notifications"
  ON public.supply_notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_supply_notifications_user ON public.supply_notifications(user_id, read, created_at DESC);

-- 3. Add webhook_url to shopify_sellers for push notifications
ALTER TABLE public.shopify_sellers ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- 4. Enable Realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.supply_notifications;
