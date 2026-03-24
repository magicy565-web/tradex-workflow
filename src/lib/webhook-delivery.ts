/**
 * Webhook delivery service for pushing events to Shopify App.
 *
 * Events: order.fulfilled, product.updated, product.stock_low, subscription.cancelled
 */

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createHmac } from "crypto";

interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
  seller_id: string;
}

function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Sign a webhook payload with HMAC-SHA256 using the seller's api_secret.
 */
function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Deliver a webhook to a seller's registered endpoint.
 */
async function deliverWebhook(
  webhookUrl: string,
  event: string,
  data: Record<string, unknown>,
  apiSecret: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });

  const signature = signPayload(payload, apiSecret);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TradeX-Event": event,
        "X-TradeX-Signature": signature,
        "X-TradeX-Timestamp": String(Math.floor(Date.now() / 1000)),
      },
      body: payload,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const body = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, body: body.slice(0, 500) };
  } catch (error: any) {
    return { ok: false, status: 0, body: error?.message || "Network error" };
  }
}

/**
 * Queue and deliver a webhook event to a seller.
 * Logs the attempt and schedules retry on failure.
 */
export async function pushWebhookEvent({ event, data, seller_id }: WebhookEvent): Promise<void> {
  const admin = createAdminClient();

  // Get seller info
  const { data: seller } = await admin
    .from("shopify_sellers")
    .select("id, webhook_url, api_secret, app_installed")
    .eq("id", seller_id)
    .single();

  if (!seller?.webhook_url || !seller.app_installed) {
    return; // No webhook URL configured or app not installed
  }

  // Create log entry
  const { data: log } = await admin
    .from("supply_webhook_logs")
    .insert({
      seller_id,
      event,
      payload: data,
      status: "pending",
      attempts: 1,
    })
    .select("id")
    .single();

  // Deliver
  const result = await deliverWebhook(seller.webhook_url, event, data, seller.api_secret);

  // Update log
  await admin
    .from("supply_webhook_logs")
    .update({
      status: result.ok ? "sent" : "failed",
      response_status: result.status,
      response_body: result.body,
      sent_at: result.ok ? new Date().toISOString() : null,
      next_retry_at: result.ok
        ? null
        : new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 min
    })
    .eq("id", log?.id);
}

/**
 * Push webhook events to all sellers who subscribe to a product.
 */
export async function pushWebhookToProductSubscribers(
  productId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();

  const { data: subscriptions } = await admin
    .from("supply_subscriptions")
    .select("seller_id")
    .eq("product_id", productId)
    .eq("status", "active");

  if (!subscriptions?.length) return;

  // Deduplicate seller_ids
  const sellerIds = [...new Set(subscriptions.map((s) => s.seller_id))];

  // Send to all subscribers in parallel (fire-and-forget)
  await Promise.allSettled(
    sellerIds.map((seller_id) =>
      pushWebhookEvent({ event, data: { ...data, product_id: productId }, seller_id })
    )
  );
}
