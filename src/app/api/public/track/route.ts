import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { classifySource, hashIp } from "@/lib/geo-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/public/track — Public tracking endpoint (no auth required)
 *
 * Called by client-side JS on public pages to record visits and events.
 */
export async function POST(request: Request) {
  // Rate limit: 60 track events per IP per minute
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`track:${clientIp}`, 60, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }); // silently drop, don't error on tracking
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  let body: {
    page_slug: string;
    event?: string;
    referrer?: string;
    utm?: Record<string, string>;
    event_data?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.page_slug) {
    return NextResponse.json({ error: "page_slug is required" }, { status: 400 });
  }

  // Look up the page
  const { data: page } = await adminClient
    .from("geo_pages")
    .select("id, user_id, status")
    .eq("slug", body.page_slug)
    .eq("status", "published")
    .single();

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Extract visitor info from request headers
  const referrer = body.referrer || request.headers.get("referer") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const ipHash = await hashIp(ip);

  // Classify source
  const { source, isBot, botName } = classifySource(referrer, userAgent);

  // Determine country from headers (Vercel/Cloudflare provide this)
  const country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    null;

  const eventType = body.event || "page_view";

  // Record visit (for page_view events)
  let visitId: string | null = null;

  if (eventType === "page_view") {
    const { data: visit } = await adminClient
      .from("geo_visits")
      .insert({
        page_id: page.id,
        user_id: page.user_id,
        source,
        referrer: referrer.slice(0, 500),
        user_agent: userAgent.slice(0, 500),
        visitor_country: country,
        visitor_ip_hash: ipHash,
        is_bot: isBot,
        bot_name: botName || null,
        utm_source: body.utm?.utm_source || null,
        utm_medium: body.utm?.utm_medium || null,
        utm_campaign: body.utm?.utm_campaign || null,
      })
      .select("id")
      .single();

    visitId = visit?.id || null;
  }

  // Record event
  await adminClient
    .from("geo_events")
    .insert({
      page_id: page.id,
      user_id: page.user_id,
      visit_id: visitId,
      event_type: eventType,
      event_data: body.event_data || {},
      source,
    });

  return NextResponse.json({ ok: true, source, visit_id: visitId });
}
