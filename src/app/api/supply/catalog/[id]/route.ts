import { verifyHmacAuth } from "@/lib/hmac-auth";
import { NextResponse } from "next/server";

// GET /api/supply/catalog/[id] - Get single product detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyHmacAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;

  const { data, error } = await adminClient
    .from("supply_products")
    .select(
      "id, title, title_zh, description, category, images, supply_price, msrp, currency, moq, lead_time_days, stock_quantity, specs, variants, weight_kg, dimensions, origin_country, hs_code, subscribers_count, created_at, updated_at"
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
