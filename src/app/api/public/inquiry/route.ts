import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { classifySource } from "@/lib/geo-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notification-center";

/**
 * POST /api/public/inquiry — Public inquiry submission (no auth required)
 *
 * Buyers submit inquiries from public GEO pages.
 */
export async function POST(request: Request) {
  // Rate limit: 10 inquiries per IP per 15 minutes
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`inquiry:${clientIp}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  let body: {
    page_slug: string;
    contact_name: string;
    email: string;
    company_name?: string;
    phone?: string;
    country?: string;
    inquiry_type?: string;
    message?: string;
    quantity_estimate?: string;
    referrer?: string;
    visit_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.page_slug || !body.contact_name || !body.email) {
    return NextResponse.json(
      { error: "page_slug, contact_name, and email are required" },
      { status: 400 }
    );
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Look up the page
  const { data: page } = await adminClient
    .from("geo_pages")
    .select("id, user_id, title, slug")
    .eq("slug", body.page_slug)
    .eq("status", "published")
    .single();

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Classify source
  const referrer = body.referrer || request.headers.get("referer") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const { source } = classifySource(referrer, userAgent);

  // Record the inquiry
  const { data: inquiry, error } = await adminClient
    .from("geo_inquiries")
    .insert({
      page_id: page.id,
      user_id: page.user_id,
      visit_id: body.visit_id || null,
      company_name: body.company_name || null,
      contact_name: body.contact_name,
      email: body.email,
      phone: body.phone || null,
      country: body.country || null,
      inquiry_type: body.inquiry_type || "wholesale",
      message: body.message || null,
      quantity_estimate: body.quantity_estimate || null,
      source,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }

  // Record conversion event
  await adminClient.from("geo_events").insert({
    page_id: page.id,
    user_id: page.user_id,
    visit_id: body.visit_id || null,
    event_type: "inquiry_submit",
    event_data: {
      inquiry_id: inquiry.id,
      inquiry_type: body.inquiry_type || "wholesale",
    },
    source,
  });

  // Fire-and-forget: notify supplier via in-app notification center
  const sourceLabel = source.startsWith("ai_") ? `AI (${source.replace("ai_", "")})` : source;
  createNotification({
    user_id: page.user_id,
    type: "geo.inquiry",
    title: "新的 GEO 询盘",
    message: `${body.contact_name}${body.company_name ? ` (${body.company_name})` : ""} 通过「${page.title}」提交了询盘，来源: ${sourceLabel}`,
    data: {
      inquiry_id: inquiry.id,
      page_slug: page.slug,
      page_title: page.title,
      contact_name: body.contact_name,
      email: body.email,
      source,
    },
  }).catch(() => {}); // fire-and-forget

  return NextResponse.json({
    ok: true,
    inquiry_id: inquiry.id,
    message: "Inquiry submitted successfully. The supplier will contact you soon.",
  });
}
