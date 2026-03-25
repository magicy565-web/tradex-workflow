import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/supply/returns/[id] - Get single return detail
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
    .from("supply_returns")
    .select(
      "*, seller:shopify_sellers(id, shop_domain, shop_name), product:supply_products(id, title, title_zh), order:supply_orders(id, order_number)"
    )
    .eq("id", id)
    .eq("supplier_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PUT /api/supply/returns/[id] - Supplier updates return (notes only)
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

  const { data, error } = await supabase
    .from("supply_returns")
    .update({ notes: body.notes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("supplier_id", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
