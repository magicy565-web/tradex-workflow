import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateContentScore, generateSlug } from "@/lib/geo-utils";

// GET /api/geo/pages — List supplier's GEO pages
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("geo_pages")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    pages: data || [],
    pagination: { page, limit, total: count || 0 },
  });
}

// POST /api/geo/pages — Create a GEO page (manual)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.title || !body.page_type || !body.entity_id) {
    return NextResponse.json(
      { error: "title, page_type, and entity_id are required" },
      { status: 400 }
    );
  }

  const slug = generateSlug(body.title, body.entity_id);

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("geo_pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

  const specs = body.structured_specs || [];
  const trustSignals = body.trust_signals || [];
  const faq = body.faq || [];
  const gallery = body.gallery || [];
  const factoryProfile = body.factory_profile || {};

  const { total, breakdown } = calculateContentScore({
    title: body.title,
    meta_description: body.meta_description,
    structured_specs: specs,
    trust_signals: trustSignals,
    faq,
    gallery,
    factory_profile: factoryProfile,
    page_type: body.page_type,
  });

  const { data, error } = await supabase
    .from("geo_pages")
    .insert({
      user_id: user.id,
      page_type: body.page_type,
      entity_id: body.entity_id,
      slug: finalSlug,
      title: body.title,
      meta_description: body.meta_description || null,
      hero_content: body.hero_content || {},
      structured_specs: specs,
      trust_signals: trustSignals,
      faq,
      gallery,
      factory_profile: factoryProfile,
      jsonld: body.jsonld || {},
      content_score: total,
      score_breakdown: breakdown,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
