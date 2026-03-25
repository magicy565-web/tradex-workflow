import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/geo/inquiries — List supplier's inquiries
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
    .from("geo_inquiries")
    .select("*, page:geo_pages(id, title, slug, page_type)", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten joined page data for frontend convenience
  const inquiries = (data || []).map((row) => {
    const { page, ...rest } = row as Record<string, unknown>;
    const p = page as { title?: string; slug?: string; page_type?: string } | null;
    return {
      ...rest,
      page_title: p?.title || null,
      page_slug: p?.slug || null,
      page_type: p?.page_type || null,
    };
  });

  return NextResponse.json({
    inquiries,
    pagination: { page, limit, total: count || 0 },
  });
}
