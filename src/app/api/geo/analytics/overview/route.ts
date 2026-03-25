import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/geo/analytics/overview — Supplier's GEO analytics dashboard data
 *
 * Query: ?period=30 (default 30, max 90)
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("period") || url.searchParams.get("days") || "30")));
  const sinceDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  // Fetch daily stats
  const { data: dailyStats } = await supabase
    .from("geo_daily_stats")
    .select("*")
    .eq("user_id", user.id)
    .gte("stat_date", sinceDate)
    .order("stat_date", { ascending: true });

  const stats = dailyStats || [];

  // Aggregate from source_breakdown in each row
  let totalVisits = 0;
  let totalInquiries = 0;
  const sourceAgg: Record<string, number> = {};

  for (const row of stats) {
    totalVisits += row.visits || 0;
    totalInquiries += row.inquiries || 0;
    const sb = (row.source_breakdown || {}) as Record<string, number>;
    for (const [src, cnt] of Object.entries(sb)) {
      sourceAgg[src] = (sourceAgg[src] || 0) + cnt;
    }
  }

  // AI breakdown
  const aiBreakdown: Record<string, number> = {};
  let aiTotal = 0;
  for (const [src, cnt] of Object.entries(sourceAgg)) {
    if (src.startsWith("ai_")) {
      aiBreakdown[src] = cnt;
      aiTotal += cnt;
    }
  }

  // Build trend data in shape dashboard expects
  const trend = stats.map((row) => ({
    date: row.stat_date,
    visits: row.visits || 0,
    ai_visits: row.ai_visits || 0,
    inquiries: row.inquiries || 0,
  }));

  // Fetch top pages
  const { data: topPages } = await supabase
    .from("geo_pages")
    .select("id, slug, title, content_score, status")
    .eq("user_id", user.id)
    .eq("status", "published")
    .order("content_score", { ascending: false })
    .limit(10);

  // Page counts
  const { count: publishedCount } = await supabase
    .from("geo_pages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "published");

  const { count: draftCount } = await supabase
    .from("geo_pages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "draft");

  const { count: totalPageCount } = await supabase
    .from("geo_pages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "archived");

  const conversionRate = totalVisits > 0
    ? Math.round((totalInquiries / totalVisits) * 10000) / 100
    : 0;

  return NextResponse.json({
    totals: {
      visits: totalVisits,
      ai_visits: aiTotal,
      inquiries: totalInquiries,
      conversion_rate: conversionRate,
    },
    ai_breakdown: aiBreakdown,
    page_counts: {
      total: totalPageCount || 0,
      published: publishedCount || 0,
      draft: draftCount || 0,
    },
    top_pages: (topPages || []).map((p) => ({
      slug: p.slug,
      title: p.title,
      visits: 0, // TODO: join with daily stats for per-page visit count
      inquiries: 0,
    })),
    trend,
  });
}
