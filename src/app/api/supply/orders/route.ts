import { verifyHmacAuth } from "@/lib/hmac-auth";
import { createClient } from "@/lib/supabase/server";
import { sendSupplyNotification } from "@/lib/supply-notifications";
import { NextResponse } from "next/server";

// POST /api/supply/orders - Create a supply chain order (from Shopify App)
export async function POST(request: Request) {
  const auth = await verifyHmacAuth(request);
  if (!auth.success) return auth.response;

  const { seller, adminClient } = auth;
  const body = await request.json();

  // Validate required fields
  if (!body.product_id || !body.shipping_address || !body.quantity) {
    return NextResponse.json(
      { error: "product_id, quantity, and shipping_address are required" },
      { status: 400 }
    );
  }

  // Get product details for pricing
  const { data: product, error: productError } = await adminClient
    .from("supply_products")
    .select("id, user_id, title, supply_price, lead_time_days")
    .eq("id", body.product_id)
    .eq("status", "active")
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found or not active" }, { status: 404 });
  }

  // Fetch seller's commission rate
  const { data: sellerDetails } = await adminClient
    .from("shopify_sellers")
    .select("commission_rate")
    .eq("id", seller.id)
    .single();

  const commissionRate = sellerDetails?.commission_rate || 0.05;

  // Generate order number
  const { data: orderNumber } = await adminClient.rpc("generate_order_number");

  const quantity = body.quantity;

  // Check for tiered pricing
  const { data: priceTiers } = await adminClient
    .from("supply_price_tiers")
    .select("min_quantity, max_quantity, unit_price")
    .eq("product_id", body.product_id)
    .order("min_quantity", { ascending: true });

  let unitCost = product.supply_price;
  if (priceTiers && priceTiers.length > 0) {
    for (const tier of priceTiers) {
      if (
        quantity >= tier.min_quantity &&
        (tier.max_quantity == null || quantity <= tier.max_quantity)
      ) {
        unitCost = tier.unit_price;
        break;
      }
    }
  }

  const totalCost = unitCost * quantity;
  const commission = totalCost * commissionRate;

  // Find subscription if exists
  const { data: subscription } = await adminClient
    .from("supply_subscriptions")
    .select("id")
    .eq("seller_id", seller.id)
    .eq("product_id", body.product_id)
    .eq("status", "active")
    .maybeSingle();

  const { data: order, error } = await adminClient
    .from("supply_orders")
    .insert({
      order_number: orderNumber || `TX-${Date.now()}`,
      supplier_id: product.user_id,
      seller_id: seller.id,
      product_id: body.product_id,
      subscription_id: subscription?.id || null,
      shopify_order_id: body.shopify_order_id || null,
      shopify_order_name: body.shopify_order_name || null,
      quantity,
      variant_info: body.variant_info || null,
      unit_cost: unitCost,
      total_cost: totalCost,
      seller_price: body.seller_price || null,
      commission,
      shipping_address: body.shipping_address,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update seller's total_orders count
  await adminClient
    .from("shopify_sellers")
    .update({ total_orders: seller.id })
    .eq("id", seller.id);

  // Fire-and-forget notification to supplier
  sendSupplyNotification("order.new", {
    shop_domain: seller.shop_domain,
    seller_name: seller.shop_name,
    product_title: product.title,
    quantity,
    order_number: order.order_number,
    total_cost: totalCost.toFixed(2),
  }).catch(() => {});

  const estimatedShipDate = new Date();
  estimatedShipDate.setDate(estimatedShipDate.getDate() + (product.lead_time_days || 7));

  return NextResponse.json(
    {
      ...order,
      estimated_ship_date: estimatedShipDate.toISOString().split("T")[0],
    },
    { status: 201 }
  );
}

// GET /api/supply/orders - List orders (for authenticated supplier)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("supply_orders")
    .select(
      "*, seller:shopify_sellers(id, shop_domain, shop_name), product:supply_products(id, title, title_zh, images)",
      { count: "exact" }
    )
    .eq("supplier_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: { page, limit, total: count || 0 },
  });
}
