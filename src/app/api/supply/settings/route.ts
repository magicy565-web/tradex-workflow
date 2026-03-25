import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DEFAULT_SETTINGS = {
  auto_confirm_orders: false,
  auto_approve_returns: false,
  return_window_days: 15,
  default_commission: 0.05,
  require_seller_approval: false,
  low_stock_notify: true,
};

// GET /api/supply/settings - Get supplier settings
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("supply_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ data: { user_id: user.id, ...DEFAULT_SETTINGS } });
  }

  return NextResponse.json({ data });
}

// PUT /api/supply/settings - Update supplier settings
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Build upsert payload with only allowed fields
  const upsertFields: Record<string, unknown> = { user_id: user.id };
  const allowedFields = [
    "auto_confirm_orders",
    "auto_approve_returns",
    "return_window_days",
    "default_commission",
    "require_seller_approval",
    "low_stock_notify",
    "wecom_webhook_url",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      upsertFields[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("supply_settings")
    .upsert(upsertFields, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
