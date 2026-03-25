import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/geo/stats/aggregate — Aggregate daily GEO stats
 *
 * Call this via cron job or manual trigger. Aggregates yesterday's
 * visits, events, and inquiries into geo_daily_stats.
 *
 * Requires CRON_SECRET header for security.
 */
export async function POST(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  // Default: aggregate yesterday. Allow override via query param.
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const targetDate = dateParam || getYesterday();

  const dayStart = `${targetDate}T00:00:00.000Z`;
  const dayEnd = `${targetDate}T23:59:59.999Z`;

  // Get all published pages
  const { data: pages } = await adminClient
    .from("geo_pages")
    .select("id, user_id")
    .in("status", ["published", "draft"]);

  if (!pages || pages.length === 0) {
    return NextResponse.json({ ok: true, message: "No pages to aggregate", processed: 0 });
  }

  let processed = 0;
  let errors = 0;

  for (const page of pages) {
    try {
      // Count visits by source
      const { data: visits } = await adminClient
        .from("geo_visits")
        .select("source, is_bot")
        .eq("page_id", page.id)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      const visitArr = visits || [];
      const totalVisits = visitArr.length;
      const botVisits = visitArr.filter((v) => v.is_bot).length;

      // Source breakdown
      const sourceBreakdown: Record<string, number> = {};
      for (const v of visitArr) {
        sourceBreakdown[v.source] = (sourceBreakdown[v.source] || 0) + 1;
      }

      // Count AI visits
      const aiVisits = Object.entries(sourceBreakdown)
        .filter(([s]) => s.startsWith("ai_"))
        .reduce((sum, [, c]) => sum + c, 0);

      // Count inquiries
      const { count: inquiryCount } = await adminClient
        .from("geo_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("page_id", page.id)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      // Count events by type
      const { data: events } = await adminClient
        .from("geo_events")
        .select("event_type")
        .eq("page_id", page.id)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      const eventBreakdown: Record<string, number> = {};
      for (const e of events || []) {
        eventBreakdown[e.event_type] = (eventBreakdown[e.event_type] || 0) + 1;
      }

      // Skip if no activity
      if (totalVisits === 0 && (inquiryCount || 0) === 0) continue;

      // Upsert daily stats
      await adminClient.from("geo_daily_stats").upsert(
        {
          page_id: page.id,
          user_id: page.user_id,
          stat_date: targetDate,
          visits: totalVisits,
          unique_visitors: totalVisits, // simplified; could use ip_hash distinct
          ai_visits: aiVisits,
          bot_visits: botVisits,
          inquiries: inquiryCount || 0,
          source_breakdown: sourceBreakdown,
          event_breakdown: eventBreakdown,
        },
        { onConflict: "page_id,stat_date" }
      );

      processed++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    date: targetDate,
    processed,
    errors,
    total_pages: pages.length,
  });
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
