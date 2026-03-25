import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateContentScore, generateContentHints } from "@/lib/geo-utils";

// GET /api/geo/pages/[id] — Get single page detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("geo_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Generate optimization hints
  const scoreInput = {
    title: data.title as string,
    meta_description: data.meta_description as string,
    structured_specs: (data.structured_specs || []) as [],
    trust_signals: (data.trust_signals || []) as [],
    faq: (data.faq || []) as [],
    gallery: (data.gallery || []) as [],
    factory_profile: (data.factory_profile || {}) as Record<string, unknown>,
    page_type: data.page_type as "product" | "factory",
  };
  const hints = generateContentHints(scoreInput, (data.score_breakdown || {}) as Record<string, number>);

  return NextResponse.json({ ...data, content_hints: hints });
}

// PUT /api/geo/pages/[id] — Update page content
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Fetch current page to merge data
  const { data: current } = await supabase
    .from("geo_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const updatedFields: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // Allow updating these fields
  const editableFields = [
    "title", "meta_description", "hero_content", "structured_specs",
    "trust_signals", "faq", "gallery", "factory_profile", "jsonld",
  ];

  for (const field of editableFields) {
    if (body[field] !== undefined) {
      updatedFields[field] = body[field];
    }
  }

  // Recalculate content score
  const merged = { ...current, ...updatedFields };
  const { total, breakdown } = calculateContentScore({
    title: merged.title as string,
    meta_description: merged.meta_description as string,
    structured_specs: merged.structured_specs as [],
    trust_signals: merged.trust_signals as [],
    faq: merged.faq as [],
    gallery: merged.gallery as [],
    factory_profile: merged.factory_profile as Record<string, unknown>,
    page_type: current.page_type,
  });

  updatedFields.content_score = total;
  updatedFields.score_breakdown = breakdown;

  const { data, error } = await supabase
    .from("geo_pages")
    .update(updatedFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE /api/geo/pages/[id] — Archive page
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("geo_pages")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
