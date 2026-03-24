import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/supply/products/import - Import products from a TradeX site into supply chain
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { site_id } = body;

  if (!site_id) {
    return NextResponse.json({ error: "site_id is required" }, { status: 400 });
  }

  // Get site data
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, site_data, company_name_en, products")
    .eq("id", site_id)
    .eq("user_id", user.id)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const siteData = site.site_data as Record<string, any>;
  const siteProducts = siteData?.products || [];

  if (!siteProducts.length) {
    return NextResponse.json({ error: "No products found in site data" }, { status: 400 });
  }

  // Convert site products to supply chain products
  const supplyProducts = siteProducts.map((p: any) => ({
    user_id: user.id,
    site_id: site.id,
    title: p.name || p.title || "Untitled Product",
    title_zh: p.name_zh || null,
    description: p.description || p.subtitle || null,
    category: p.category || (site.products?.[0] || null),
    images: p.images || p.image ? [p.image] : [],
    supply_price: body.default_price || 0,
    msrp: body.default_msrp || null,
    moq: body.default_moq || 1,
    lead_time_days: body.default_lead_time || 7,
    stock_quantity: body.default_stock || 0,
    specs: Array.isArray(p.specs)
      ? p.specs.map((s: any) => ({ label: s.label || s.key, value: s.value }))
      : [],
    origin_country: "CN",
    status: "draft",
  }));

  const { data, error } = await supabase
    .from("supply_products")
    .insert(supplyProducts)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Successfully imported ${data.length} products`,
    count: data.length,
    products: data,
  }, { status: 201 });
}
