import { verifyHmacAuth } from "@/lib/hmac-auth";
import { sendSupplyNotification } from "@/lib/supply-notifications";
import { NextResponse } from "next/server";

// POST /api/supply/subscriptions - Seller subscribes to a product
export async function POST(request: Request) {
  const auth = await verifyHmacAuth(request);
  if (!auth.success) return auth.response;

  const { seller, adminClient } = auth;
  const body = await request.json();

  if (!body.product_id) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  // Verify product exists and is active
  const { data: product, error: productError } = await adminClient
    .from("supply_products")
    .select("id, user_id, title")
    .eq("id", body.product_id)
    .eq("status", "active")
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found or not active" }, { status: 404 });
  }

  // Create subscription
  const { data, error } = await adminClient
    .from("supply_subscriptions")
    .insert({
      seller_id: seller.id,
      product_id: body.product_id,
      supplier_id: product.user_id,
      shopify_product_id: body.shopify_product_id || null,
      markup_type: body.markup_type || "percentage",
      markup_value: body.markup_value ?? 30,
      auto_sync: body.auto_sync ?? true,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already subscribed to this product" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget notification to supplier
  sendSupplyNotification("subscription.new", {
    shop_domain: seller.shop_domain,
    seller_name: seller.shop_name,
    product_title: product.title,
  }).catch(() => {});

  return NextResponse.json(data, { status: 201 });
}

// GET /api/supply/subscriptions - List seller's subscriptions
export async function GET(request: Request) {
  const auth = await verifyHmacAuth(request);
  if (!auth.success) return auth.response;

  const { seller, adminClient } = auth;
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "active";

  const { data, error } = await adminClient
    .from("supply_subscriptions")
    .select("*, product:supply_products(id, title, title_zh, images, supply_price, currency, stock_quantity)")
    .eq("seller_id", seller.id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
