import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/geo/pages/[id]/publish — Publish or unpublish a page
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body.action || "publish"; // "publish" | "unpublish"

  const { data: page } = await supabase
    .from("geo_pages")
    .select("id, status, content_score")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  if (action === "publish") {
    if (page.status === "published") {
      return NextResponse.json({ error: "Page is already published" }, { status: 400 });
    }

    // Require minimum content score to publish
    if (page.content_score < 20) {
      return NextResponse.json(
        { error: "Content score too low to publish. Please add more product information." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("geo_pages")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "unpublish") {
    const { data, error } = await supabase
      .from("geo_pages")
      .update({
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
