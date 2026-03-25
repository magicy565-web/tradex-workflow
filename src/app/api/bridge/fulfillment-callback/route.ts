/**
 * Bridge API: Fulfillment Callback → Notify Factory System
 *
 * POST — When a TradeX supplier ships an order, this endpoint is called
 *         to push tracking info back to the factory system, which then
 *         updates the Shopify fulfillment via Shopify Admin API.
 *
 * Called internally when supply_orders status transitions to 'shipped'.
 * The factory system receives the tracking data and writes it to Shopify.
 */

import { NextResponse } from "next/server";
import { verifyBridgeAuth, logBridgeSync } from "@/lib/bridge-auth";

export async function POST(request: Request) {
  const auth = await verifyBridgeAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;

  let body: {
    order_id: string;
    order_number: string;
    shopify_order_id?: number;
    tracking_company?: string;
    tracking_number: string;
    tracking_url?: string;
    shop_domain: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.order_id || !body.tracking_number || !body.shop_domain) {
    return NextResponse.json(
      { error: "order_id, tracking_number, and shop_domain are required" },
      { status: 400 }
    );
  }

  await logBridgeSync(adminClient, {
    direction: "tradex_to_factory",
    entity_type: "fulfillment",
    entity_id: body.order_id,
    action: "callback",
    details: {
      order_number: body.order_number,
      shopify_order_id: body.shopify_order_id,
      tracking_company: body.tracking_company,
      tracking_number: body.tracking_number,
      shop_domain: body.shop_domain,
    },
  });

  // The factory system will poll this or we push to it.
  // For now, return success — the factory system's webhook delivery
  // already handles pushing to sellers via pushWebhookEvent.
  return NextResponse.json({
    received: true,
    message: "Fulfillment data logged. Factory system should update Shopify fulfillment.",
  });
}
