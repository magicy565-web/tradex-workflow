import { createClient } from "@/lib/supabase/server";
import { sendSupplyNotification } from "@/lib/supply-notifications";
import { pushWebhookEvent } from "@/lib/webhook-delivery";
import { NextResponse } from "next/server";

// PUT /api/supply/orders/[id]/fulfill - Fill tracking info and mark as shipped
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.tracking_number) {
    return NextResponse.json({ error: "tracking_number is required" }, { status: 400 });
  }

  // Verify order status allows fulfillment
  const { data: order, error: fetchError } = await supabase
    .from("supply_orders")
    .select("id, status, seller_id, order_number")
    .eq("id", id)
    .eq("supplier_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!["confirmed", "processing"].includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot fulfill order in ${order.status} status. Must be confirmed or processing.` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("supply_orders")
    .update({
      status: "shipped",
      tracking_company: body.tracking_company || null,
      tracking_number: body.tracking_number,
      tracking_url: body.tracking_url || null,
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("supplier_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify about shipment (WeChat Work)
  sendSupplyNotification("order.shipped", {
    order_number: data.order_number,
    tracking_company: body.tracking_company,
    tracking_number: body.tracking_number,
    tracking_url: body.tracking_url,
  }).catch(() => {});

  // Push webhook to seller's Shopify App
  pushWebhookEvent({
    event: "order.fulfilled",
    data: {
      order_id: data.id,
      order_number: data.order_number,
      tracking_company: body.tracking_company || null,
      tracking_number: body.tracking_number,
      tracking_url: body.tracking_url || null,
    },
    seller_id: order.seller_id,
  }).catch(() => {});

  // Push fulfillment to factory system → Shopify Fulfillment API
  if (data.shopify_order_id) {
    const { data: seller } = await supabase
      .from("shopify_sellers")
      .select("shop_domain")
      .eq("id", order.seller_id)
      .single();

    if (seller?.shop_domain) {
      pushFulfillmentToFactorySystem({
        shop_domain: seller.shop_domain,
        shopify_order_id: data.shopify_order_id,
        tracking_number: body.tracking_number,
        tracking_company: body.tracking_company || null,
        tracking_url: body.tracking_url || null,
        order_number: data.order_number,
      }).catch(() => {});
    }
  }

  return NextResponse.json(data);
}

/**
 * Fire-and-forget: push fulfillment data to factory system
 * so it can write to Shopify Fulfillment API.
 */
async function pushFulfillmentToFactorySystem(payload: {
  shop_domain: string;
  shopify_order_id: number;
  tracking_number: string;
  tracking_company: string | null;
  tracking_url: string | null;
  order_number: string;
}): Promise<void> {
  const bridgeUrl = process.env.FACTORY_SYSTEM_URL;
  const bridgeSecret = process.env.BRIDGE_API_SECRET;
  if (!bridgeUrl || !bridgeSecret) return;

  const { createHmac } = await import("crypto");
  const jsonBody = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", bridgeSecret)
    .update(jsonBody + timestamp)
    .digest("hex");

  await fetch(`${bridgeUrl}/api/sci/bridge/fulfillment-callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Bridge-Source": "tradex",
      "X-Bridge-Signature": signature,
      "X-Bridge-Timestamp": timestamp,
    },
    body: jsonBody,
    signal: AbortSignal.timeout(10000),
  }).catch(() => {});
}
