import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/supply/products - List current user's supply chain products
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
    .from("supply_products")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
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

// POST /api/supply/products - Create a new supply chain product
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate required fields
  if (!body.title || body.supply_price == null) {
    return NextResponse.json(
      { error: "title and supply_price are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("supply_products")
    .insert({
      user_id: user.id,
      site_id: body.site_id || null,
      title: body.title,
      title_zh: body.title_zh || null,
      description: body.description || null,
      category: body.category || null,
      images: body.images || [],
      sku: body.sku || null,
      supply_price: body.supply_price,
      msrp: body.msrp || null,
      currency: body.currency || "USD",
      moq: body.moq || 1,
      lead_time_days: body.lead_time_days || 7,
      stock_quantity: body.stock_quantity || 0,
      specs: body.specs || [],
      variants: body.variants || [],
      weight_kg: body.weight_kg || null,
      dimensions: body.dimensions || null,
      origin_country: body.origin_country || "CN",
      hs_code: body.hs_code || null,
      status: body.status || "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
