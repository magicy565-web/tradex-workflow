/**
 * Bridge API: SCI Adoption → TradeX Subscription
 *
 * POST — When a Shopify seller adopts a factory match in SCI,
 *         automatically create a supply_subscription in TradeX.
 *
 * This bridges the gap between:
 *   - SCI's ProductFactoryMatch (status: adopted) in factory system
 *   - TradeX's supply_subscriptions for ongoing supply chain management
 */

import { NextResponse } from "next/server";
import { verifyBridgeAuth, logBridgeSync } from "@/lib/bridge-auth";
import { notifySupplierNewSubscription } from "@/lib/notification-center";

interface AdoptionPayload {
  factory_id: string;              // The factory being adopted as supplier
  shop_domain: string;             // Shopify seller's domain
  product_id?: string;             // TradeX supply_product.id (if known)
  factory_product_id?: string;     // factory system product ID (fallback lookup)
  markup_type?: "percentage" | "fixed";
  markup_value?: number;
  estimated_unit_cost?: number;    // From SCI cost analysis
  shopify_product_id?: number;     // Seller's Shopify product ID
  match_score?: number;            // SCI composite score for reference
  match_reasons?: Record<string, unknown>;
}

export async function POST(request: Request) {
  const auth = await verifyBridgeAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;

  let body: AdoptionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { factory_id, shop_domain } = body;

  if (!factory_id || !shop_domain) {
    return NextResponse.json(
      { error: "factory_id and shop_domain are required" },
      { status: 400 }
    );
  }

  // 1. Resolve factory → TradeX supplier (user_id)
  const { data: link } = await adminClient
    .from("factory_supplier_links")
    .select("user_id, factory_name")
    .eq("factory_id", factory_id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json(
      { error: "Factory not linked to any TradeX supplier", factory_id },
      { status: 404 }
    );
  }

  // 2. Resolve or create the Shopify seller in TradeX
  let { data: seller } = await adminClient
    .from("shopify_sellers")
    .select("id, shop_domain, shop_name, email")
    .eq("shop_domain", shop_domain)
    .maybeSingle();

  if (!seller) {
    // Auto-register the seller (they came through SCI, not direct TradeX install)
    const crypto = await import("crypto");
    const apiKey = `txk_${crypto.randomBytes(24).toString("hex")}`;
    const apiSecret = `txs_${crypto.randomBytes(32).toString("hex")}`;

    const { data: newSeller, error: sellerError } = await adminClient
      .from("shopify_sellers")
      .insert({
        shop_domain,
        api_key: apiKey,
        api_secret: apiSecret,
        app_installed: true,
        plan: "free",
        metadata: { source: "sci_adoption", factory_id },
      })
      .select("id, shop_domain, shop_name, email")
      .single();

    if (sellerError) {
      return NextResponse.json(
        { error: "Failed to register seller", detail: sellerError.message },
        { status: 500 }
      );
    }
    seller = newSeller;
  }

  // 3. Resolve the product in TradeX
  let productId = body.product_id;

  if (!productId && body.factory_product_id) {
    const { data: product } = await adminClient
      .from("supply_products")
      .select("id")
      .eq("factory_product_id", body.factory_product_id)
      .eq("user_id", link.user_id)
      .maybeSingle();

    if (product) {
      productId = product.id;
    }
  }

  if (!productId) {
    return NextResponse.json(
      {
        error: "Could not resolve product in TradeX. Sync products first or provide product_id.",
        factory_product_id: body.factory_product_id,
      },
      { status: 404 }
    );
  }

  // 4. Check for existing subscription
  const { data: existingSub } = await adminClient
    .from("supply_subscriptions")
    .select("id, status")
    .eq("seller_id", seller.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingSub) {
    if (existingSub.status === "active") {
      return NextResponse.json({
        message: "Subscription already exists and is active",
        subscription_id: existingSub.id,
        already_existed: true,
      });
    }
    // Reactivate if previously removed/paused
    const { error } = await adminClient
      .from("supply_subscriptions")
      .update({ status: "active" })
      .eq("id", existingSub.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to reactivate subscription", detail: error.message },
        { status: 500 }
      );
    }

    await logBridgeSync(adminClient, {
      direction: "factory_to_tradex",
      entity_type: "adoption",
      entity_id: existingSub.id,
      action: "reactivate",
      details: { factory_id, shop_domain, product_id: productId },
    });

    return NextResponse.json({
      subscription_id: existingSub.id,
      reactivated: true,
    });
  }

  // 5. Create new subscription
  const { data: subscription, error: subError } = await adminClient
    .from("supply_subscriptions")
    .insert({
      seller_id: seller.id,
      product_id: productId,
      supplier_id: link.user_id,
      shopify_product_id: body.shopify_product_id || null,
      markup_type: body.markup_type || "percentage",
      markup_value: body.markup_value ?? 30,
      auto_sync: true,
      status: "active",
    })
    .select("id")
    .single();

  if (subError) {
    await logBridgeSync(adminClient, {
      direction: "factory_to_tradex",
      entity_type: "adoption",
      action: "create",
      status: "failed",
      details: { error: subError.message, factory_id, shop_domain },
    });
    return NextResponse.json(
      { error: "Failed to create subscription", detail: subError.message },
      { status: 500 }
    );
  }

  // 6. Get product info for notification
  const { data: product } = await adminClient
    .from("supply_products")
    .select("title")
    .eq("id", productId)
    .single();

  // Fire-and-forget notification to supplier
  notifySupplierNewSubscription(
    link.user_id,
    shop_domain,
    seller.shop_name || null,
    product?.title || "Unknown product"
  ).catch(() => {});

  await logBridgeSync(adminClient, {
    direction: "factory_to_tradex",
    entity_type: "adoption",
    entity_id: subscription.id,
    action: "create",
    details: {
      factory_id,
      shop_domain,
      product_id: productId,
      match_score: body.match_score,
      estimated_unit_cost: body.estimated_unit_cost,
    },
  });

  return NextResponse.json({
    subscription_id: subscription.id,
    seller_id: seller.id,
    product_id: productId,
    created: true,
  });
}
