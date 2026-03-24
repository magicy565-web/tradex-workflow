import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/supply/subscribers - List sellers who subscribed to my products
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("supply_subscriptions")
    .select(
      "id, status, created_at, markup_type, markup_value, seller:shopify_sellers(id, shop_domain, shop_name, email), product:supply_products(id, title, title_zh)"
    )
    .eq("supplier_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
