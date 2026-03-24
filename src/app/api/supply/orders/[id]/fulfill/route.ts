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

  return NextResponse.json(data);
}
