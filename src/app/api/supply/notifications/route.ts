import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/supply/notifications - List notifications
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "30"), 50);

  let query = supabase
    .from("supply_notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also get unread count
  const { count: unreadCount } = await supabase
    .from("supply_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return NextResponse.json({ data, total: count, unread_count: unreadCount || 0 });
}

// PUT /api/supply/notifications - Mark notifications as read
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.mark_all_read) {
    await supabase
      .from("supply_notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    return NextResponse.json({ message: "All marked as read" });
  }

  if (body.ids && Array.isArray(body.ids)) {
    await supabase
      .from("supply_notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .in("id", body.ids);
    return NextResponse.json({ message: "Marked as read" });
  }

  return NextResponse.json({ error: "Provide ids[] or mark_all_read" }, { status: 400 });
}
