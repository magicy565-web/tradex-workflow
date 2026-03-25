/**
 * Bridge API: Forward Shopify Order → TradeX Supply Chain
 *
 * POST — When a Shopify customer buys from a seller's store,
 *         the factory system forwards the order here to create
 *         a supply_order for the linked supplier.
 *
 * This completes the loop:
 *   Customer → Shopify Store → SCI webhook → Bridge → TradeX supply_order → Supplier fulfills
 */

import { NextResponse } from "next/server";
import { verifyBridgeAuth, logBridgeSync } from "@/lib/bridge-auth";
import { notifyNewOrder } from "@/lib/supply-notifications";

interface ForwardOrderPayload {
  factory_id: string;
  shop_domain: string;
  factory_product_id: string;
  shopify_order_id?: number;
  shopify_order_name?: string;
  quantity: number;
  seller_price?: number;
  shipping_address: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  };
}

export async function POST(request: Request) {
  const auth = await verifyBridgeAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;

  let body: ForwardOrderPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { factory_id, shop_domain, factory_product_id, quantity, shipping_address } = body;

  if (!factory_id || !shop_domain || !factory_product_id || !quantity || !shipping_address) {
    return NextResponse.json(
      { error: "factory_id, shop_domain, factory_product_id, quantity, and shipping_address are required" },
      { status: 400 }
    );
  }

  // 1. Resolve factory → supplier
  const { data: link } = await adminClient
    .from("factory_supplier_links")
    .select("user_id, factory_name")
    .eq("factory_id", factory_id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json(
      { error: "Factory not linked to TradeX supplier", factory_id },
      { status: 404 }
    );
  }

  // 2. Resolve product
  const { data: product } = await adminClient
    .from("supply_products")
    .select("id, title, supply_price, lead_time_days, status")
    .eq("factory_product_id", factory_product_id)
    .eq("user_id", link.user_id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json(
      { error: "Product not found in TradeX", factory_product_id },
      { status: 404 }
    );
  }

  if (product.status !== "active") {
    return NextResponse.json(
      { error: "Product is not active", product_id: product.id, status: product.status },
      { status: 400 }
    );
  }

  // 3. Resolve or create seller
  let { data: seller } = await adminClient
    .from("shopify_sellers")
    .select("id, shop_domain, shop_name, commission_rate")
    .eq("shop_domain", shop_domain)
    .maybeSingle();

  if (!seller) {
    const crypto = await import("crypto");
    const apiKey = `txk_${crypto.randomBytes(24).toString("hex")}`;
    const apiSecret = `txs_${crypto.randomBytes(32).toString("hex")}`;

    const { data: newSeller, error: sellerErr } = await adminClient
      .from("shopify_sellers")
      .insert({
        shop_domain,
        api_key: apiKey,
        api_secret: apiSecret,
        app_installed: true,
        plan: "free",
        metadata: { source: "order_forward", factory_id },
      })
      .select("id, shop_domain, shop_name, commission_rate")
      .single();

    if (sellerErr) {
      return NextResponse.json(
        { error: "Failed to register seller", detail: sellerErr.message },
        { status: 500 }
      );
    }
    seller = newSeller;
  }

  // 4. Check for tiered pricing
  let unitCost = Number(product.supply_price);

  const { data: tiers } = await adminClient
    .from("supply_price_tiers")
    .select("min_quantity, max_quantity, unit_price")
    .eq("product_id", product.id)
    .order("min_quantity", { ascending: true });

  if (tiers && tiers.length > 0) {
    for (const tier of tiers) {
      if (quantity >= tier.min_quantity && (tier.max_quantity === null || quantity <= tier.max_quantity)) {
        unitCost = Number(tier.unit_price);
        break;
      }
    }
  }

  const totalCost = unitCost * quantity;
  const commissionRate = seller.commission_rate || 0.05;
  const commission = Math.round(totalCost * commissionRate * 100) / 100;

  // 5. Generate order number
  const { data: orderNumber } = await adminClient.rpc("generate_order_number");

  // 6. Check for duplicate (same shopify_order_id)
  if (body.shopify_order_id) {
    const { data: existing } = await adminClient
      .from("supply_orders")
      .select("id, order_number")
      .eq("shopify_order_id", body.shopify_order_id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        message: "Order already exists for this Shopify order + product",
        order_id: existing.id,
        order_number: existing.order_number,
        already_existed: true,
      });
    }
  }

  // 7. Create supply order
  const { data: order, error: orderErr } = await adminClient
    .from("supply_orders")
    .insert({
      order_number: orderNumber,
      supplier_id: link.user_id,
      seller_id: seller.id,
      product_id: product.id,
      shopify_order_id: body.shopify_order_id || null,
      shopify_order_name: body.shopify_order_name || null,
      quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      seller_price: body.seller_price || null,
      commission,
      shipping_address: shipping_address,
      status: "pending",
    })
    .select("id, order_number, status, total_cost")
    .single();

  if (orderErr) {
    await logBridgeSync(adminClient, {
      direction: "factory_to_tradex",
      entity_type: "order",
      action: "forward",
      status: "failed",
      details: { error: orderErr.message, factory_id, shop_domain },
    });
    return NextResponse.json(
      { error: "Failed to create order", detail: orderErr.message },
      { status: 500 }
    );
  }

  // 8. Fire-and-forget notifications
  notifyNewOrder(
    link.user_id,
    order.order_number,
    seller.shop_name || shop_domain,
    product.title,
    quantity,
    totalCost
  ).catch(() => {});

  await logBridgeSync(adminClient, {
    direction: "factory_to_tradex",
    entity_type: "order",
    entity_id: order.id,
    action: "forward",
    details: {
      factory_id,
      shop_domain,
      shopify_order_id: body.shopify_order_id,
      order_number: order.order_number,
      total_cost: totalCost,
    },
  });

  return NextResponse.json({
    order_id: order.id,
    order_number: order.order_number,
    total_cost: order.total_cost,
    status: order.status,
    created: true,
  });
}
