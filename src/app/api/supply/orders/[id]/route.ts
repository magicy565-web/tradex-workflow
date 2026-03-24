import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ORDER_STATUS_TRANSITIONS } from "@/types/supply-chain";

// GET /api/supply/orders/[id] - Get order detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("supply_orders")
    .select(
      "*, seller:shopify_sellers(id, shop_domain, shop_name, email), product:supply_products(id, title, title_zh, images, supply_price)"
    )
    .eq("id", id)
    .eq("supplier_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT /api/supply/orders/[id] - Update order (general update, e.g. notes)
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

  // Only allow updating notes and limited fields
  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.notes !== undefined) updateFields.notes = body.notes;

  // Status change with validation
  if (body.status) {
    const { data: currentOrder } = await supabase
      .from("supply_orders")
      .select("status")
      .eq("id", id)
      .eq("supplier_id", user.id)
      .single();

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentOrder.status] || [];
    if (!allowedTransitions.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentOrder.status} to ${body.status}` },
        { status: 400 }
      );
    }
    updateFields.status = body.status;
  }

  const { data, error } = await supabase
    .from("supply_orders")
    .update(updateFields)
    .eq("id", id)
    .eq("supplier_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
