import { verifyHmacAuth } from "@/lib/hmac-auth";
import { createNotification } from "@/lib/notification-center";
import { createClient } from "@/lib/supabase/server";
import { sendSupplyNotification } from "@/lib/supply-notifications";
import { NextResponse } from "next/server";

// GET /api/supply/returns - List returns (for authenticated supplier)
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
    .from("supply_returns")
    .select(
      "*, seller:shopify_sellers(id, shop_domain, shop_name), product:supply_products(id, title, title_zh), order:supply_orders(id, order_number)",
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
    total: count || 0,
    page,
  });
}

// POST /api/supply/returns - Create a return request (from Shopify App)
export async function POST(request: Request) {
  const auth = await verifyHmacAuth(request);
  if (!auth.success) return auth.response;

  const { seller, adminClient } = auth;
  const body = await request.json();

  // Validate required fields
  const validTypes = ["refund_only", "return_refund", "exchange"];
  if (!body.order_id || !body.type || !body.reason) {
    return NextResponse.json(
      { error: "order_id, type, and reason are required" },
      { status: 400 }
    );
  }

  if (!validTypes.includes(body.type)) {
    return NextResponse.json(
      { error: `type must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate order exists and belongs to the seller
  const { data: order, error: orderError } = await adminClient
    .from("supply_orders")
    .select("id, order_number, seller_id, supplier_id, product_id, status, unit_cost, quantity")
    .eq("id", body.order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.seller_id !== seller.id) {
    return NextResponse.json({ error: "Order does not belong to this seller" }, { status: 403 });
  }

  if (order.status !== "delivered" && order.status !== "shipped") {
    return NextResponse.json(
      { error: `Cannot create return for order in ${order.status} status` },
      { status: 400 }
    );
  }

  // Calculate refund amount if not provided
  const quantity = body.quantity || order.quantity;
  const refundAmount = body.refund_amount ?? order.unit_cost * quantity;

  // Generate return number
  const { data: returnNumber } = await adminClient.rpc("generate_return_number");

  // Get product info for notification
  const { data: product } = await adminClient
    .from("supply_products")
    .select("id, title")
    .eq("id", order.product_id)
    .single();

  const { data: returnRecord, error } = await adminClient
    .from("supply_returns")
    .insert({
      return_number: returnNumber || `RT-${Date.now()}`,
      order_id: body.order_id,
      supplier_id: order.supplier_id,
      seller_id: seller.id,
      product_id: order.product_id,
      type: body.type,
      reason: body.reason,
      description: body.description || null,
      evidence_images: body.evidence_images || null,
      quantity,
      refund_amount: refundAmount,
      status: "requested",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget WeChat notification to supplier
  sendSupplyNotification("return.requested", {
    return_number: returnRecord.return_number,
    seller_name: seller.shop_name || seller.shop_domain,
    product_title: product?.title || "",
    refund_amount: refundAmount.toFixed(2),
  }).catch(() => {});

  // Fire-and-forget in-app notification
  createNotification({
    user_id: order.supplier_id,
    type: "return.requested",
    title: "新的退货/退款请求",
    message: `${seller.shop_name || seller.shop_domain} 发起了退货请求 ${returnRecord.return_number}，商品「${product?.title || ""}」，金额 $${refundAmount.toFixed(2)}`,
    data: {
      return_number: returnRecord.return_number,
      return_id: returnRecord.id,
      seller_name: seller.shop_name || seller.shop_domain,
      product_title: product?.title || "",
      refund_amount: refundAmount,
    },
  }).catch(() => {});

  return NextResponse.json(returnRecord, { status: 201 });
}
