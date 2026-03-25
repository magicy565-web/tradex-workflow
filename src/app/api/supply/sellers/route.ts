import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/supply/sellers - List sellers subscribed to the supplier's products
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const approvalStatus = url.searchParams.get("approval_status");

  // Get distinct sellers that have subscriptions to this supplier's products
  let query = supabase
    .from("supply_subscriptions")
    .select(
      "seller:shopify_sellers(id, shop_domain, shop_name, email, plan, tier, approval_status, commission_rate, total_orders, created_at)",
      { count: "exact" }
    )
    .eq("supplier_id", user.id);

  const { data: subscriptions, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extract unique sellers from subscriptions
  const sellersMap = new Map<string, Record<string, unknown>>();
  for (const sub of subscriptions || []) {
    const seller = sub.seller as unknown as Record<string, unknown> | null;
    if (seller && seller.id && !sellersMap.has(seller.id as string)) {
      if (approvalStatus && seller.approval_status !== approvalStatus) {
        continue;
      }
      sellersMap.set(seller.id as string, seller);
    }
  }

  const data = Array.from(sellersMap.values());

  return NextResponse.json({
    data,
    total: data.length,
  });
}
