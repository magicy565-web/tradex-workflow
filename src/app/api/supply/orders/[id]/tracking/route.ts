import { verifyHmacAuth } from "@/lib/hmac-auth";
import { NextResponse } from "next/server";

// GET /api/supply/orders/[id]/tracking - Get tracking info (for Shopify App)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyHmacAuth(request);
  if (!auth.success) return auth.response;

  const { seller, adminClient } = auth;

  const { data, error } = await adminClient
    .from("supply_orders")
    .select("id, order_number, status, tracking_company, tracking_number, tracking_url, shipped_at, delivered_at")
    .eq("id", id)
    .eq("seller_id", seller.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
