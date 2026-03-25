import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/supply/products/[id]/pricing - Get price tiers for a product
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

  // Validate product belongs to auth user
  const { data: product, error: productError } = await supabase
    .from("supply_products")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("supply_price_tiers")
    .select("*")
    .eq("product_id", id)
    .order("min_quantity", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// PUT /api/supply/products/[id]/pricing - Set price tiers for a product
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

  if (!body.tiers || !Array.isArray(body.tiers) || body.tiers.length === 0) {
    return NextResponse.json(
      { error: "tiers array is required and must not be empty" },
      { status: 400 }
    );
  }

  // Validate product belongs to auth user
  const { data: product, error: productError } = await supabase
    .from("supply_products")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Delete existing tiers for this product
  const { error: deleteError } = await supabase
    .from("supply_price_tiers")
    .delete()
    .eq("product_id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Insert new tiers
  const tiersToInsert = body.tiers.map(
    (tier: { min_quantity: number; max_quantity?: number; unit_price: number }) => ({
      product_id: id,
      min_quantity: tier.min_quantity,
      max_quantity: tier.max_quantity || null,
      unit_price: tier.unit_price,
    })
  );

  const { data, error } = await supabase
    .from("supply_price_tiers")
    .insert(tiersToInsert)
    .select()
    .order("min_quantity", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
