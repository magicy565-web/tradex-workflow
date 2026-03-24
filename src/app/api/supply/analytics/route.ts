import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/supply/analytics - Supply chain analytics data
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  // Fetch all data in parallel
  const [ordersResult, productsResult, subsResult] = await Promise.all([
    // Orders in date range
    supabase
      .from("supply_orders")
      .select("id, status, total_cost, quantity, product_id, seller_id, created_at")
      .eq("supplier_id", user.id)
      .gte("created_at", sinceStr)
      .order("created_at", { ascending: true }),

    // All active products with subscriber count
    supabase
      .from("supply_products")
      .select("id, title, title_zh, supply_price, stock_quantity, subscribers_count, total_orders, status")
      .eq("user_id", user.id)
      .neq("status", "archived"),

    // Recent subscriptions
    supabase
      .from("supply_subscriptions")
      .select("id, product_id, seller_id, created_at, seller:shopify_sellers(shop_domain, shop_name)")
      .eq("supplier_id", user.id)
      .eq("status", "active")
      .gte("created_at", sinceStr)
      .order("created_at", { ascending: false }),
  ]);

  const orders = ordersResult.data || [];
  const products = productsResult.data || [];
  const newSubscriptions = subsResult.data || [];

  // --- Order trend (daily aggregation) ---
  const ordersByDay: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    const day = o.created_at.slice(0, 10);
    if (!ordersByDay[day]) ordersByDay[day] = { count: 0, revenue: 0 };
    ordersByDay[day].count++;
    ordersByDay[day].revenue += parseFloat(o.total_cost) || 0;
  }

  // Fill in missing days
  const orderTrend: { date: string; count: number; revenue: number }[] = [];
  const cursor = new Date(sinceStr);
  const today = new Date();
  while (cursor <= today) {
    const day = cursor.toISOString().slice(0, 10);
    orderTrend.push({
      date: day,
      count: ordersByDay[day]?.count || 0,
      revenue: Math.round((ordersByDay[day]?.revenue || 0) * 100) / 100,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // --- Order status distribution ---
  const statusDistribution: Record<string, number> = {};
  for (const o of orders) {
    statusDistribution[o.status] = (statusDistribution[o.status] || 0) + 1;
  }

  // --- Top products (by order volume) ---
  const productOrderMap: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    if (!productOrderMap[o.product_id]) productOrderMap[o.product_id] = { count: 0, revenue: 0 };
    productOrderMap[o.product_id].count += o.quantity;
    productOrderMap[o.product_id].revenue += parseFloat(o.total_cost) || 0;
  }

  const topProducts = products
    .map((p) => ({
      id: p.id,
      title: p.title,
      title_zh: p.title_zh,
      subscribers: p.subscribers_count,
      orders_period: productOrderMap[p.id]?.count || 0,
      revenue_period: Math.round((productOrderMap[p.id]?.revenue || 0) * 100) / 100,
      stock: p.stock_quantity,
      status: p.status,
    }))
    .sort((a, b) => b.revenue_period - a.revenue_period)
    .slice(0, 10);

  // --- Seller distribution (by order volume) ---
  const sellerOrderMap: Record<string, number> = {};
  for (const o of orders) {
    sellerOrderMap[o.seller_id] = (sellerOrderMap[o.seller_id] || 0) + 1;
  }

  // --- Low stock alerts ---
  const lowStockProducts = products
    .filter((p) => p.status === "active" && p.stock_quantity < 10)
    .map((p) => ({ id: p.id, title: p.title, stock: p.stock_quantity }));

  // --- Summary metrics ---
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_cost) || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return NextResponse.json({
    period_days: days,
    summary: {
      total_orders: orders.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      avg_order_value: Math.round(avgOrderValue * 100) / 100,
      new_subscriptions: newSubscriptions.length,
      active_products: products.filter((p) => p.status === "active").length,
      low_stock_count: lowStockProducts.length,
    },
    order_trend: orderTrend,
    status_distribution: statusDistribution,
    top_products: topProducts,
    low_stock_products: lowStockProducts,
    unique_sellers: Object.keys(sellerOrderMap).length,
  });
}
