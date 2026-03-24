import { createClient } from "@/lib/supabase/server";
import { sendSupplyNotification } from "@/lib/supply-notifications";
import { NextResponse } from "next/server";

// PUT /api/supply/orders/[id]/confirm - Confirm an order
export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify order exists and is in pending status
  const { data: order, error: fetchError } = await supabase
    .from("supply_orders")
    .select("id, status")
    .eq("id", id)
    .eq("supplier_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot confirm order in ${order.status} status` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("supply_orders")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("supplier_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify about confirmation
  sendSupplyNotification("order.confirmed", {
    order_number: data.order_number,
  }).catch(() => {});

  return NextResponse.json(data);
}
