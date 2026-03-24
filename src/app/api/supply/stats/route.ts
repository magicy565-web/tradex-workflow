import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/supply/stats - Supply chain dashboard stats
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch counts in parallel
  const [productsResult, activeResult, subsResult, ordersResult, pendingResult, revenueResult] =
    await Promise.all([
      supabase
        .from("supply_products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("supply_products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("supply_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", user.id)
        .eq("status", "active"),
      supabase
        .from("supply_orders")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", user.id),
      supabase
        .from("supply_orders")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("supply_orders")
        .select("total_cost")
        .eq("supplier_id", user.id)
        .in("status", ["confirmed", "processing", "shipped", "delivered"]),
    ]);

  const totalRevenue = (revenueResult.data || []).reduce(
    (sum, o) => sum + (parseFloat(o.total_cost) || 0),
    0
  );

  return NextResponse.json({
    total_products: productsResult.count || 0,
    active_products: activeResult.count || 0,
    total_subscribers: subsResult.count || 0,
    total_orders: ordersResult.count || 0,
    pending_orders: pendingResult.count || 0,
    total_revenue: Math.round(totalRevenue * 100) / 100,
  });
}
