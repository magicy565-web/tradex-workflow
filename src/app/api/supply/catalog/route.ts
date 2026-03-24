import { verifyHmacAuth } from "@/lib/hmac-auth";
import { NextResponse } from "next/server";

// GET /api/supply/catalog - Public product catalog for Shopify App
export async function GET(request: Request) {
  const auth = await verifyHmacAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const updatedSince = url.searchParams.get("updated_since");

  let query = adminClient
    .from("supply_products")
    .select(
      "id, title, title_zh, description, category, images, supply_price, msrp, currency, moq, lead_time_days, stock_quantity, specs, variants, weight_kg, dimensions, origin_country, hs_code, subscribers_count, created_at, updated_at",
      { count: "exact" }
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,title_zh.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (updatedSince) {
    query = query.gte("updated_at", updatedSince);
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
