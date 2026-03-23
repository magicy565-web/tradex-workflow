import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/inquiries - List user's inquiries
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("inquiries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (siteId) query = query.eq("site_id", siteId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/inquiries - Submit a new inquiry (public, from generated sites)
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  if (!body.site_id) {
    return NextResponse.json(
      { error: "site_id is required" },
      { status: 400 }
    );
  }

  // Look up the site to get the owner's user_id
  const { data: site } = await supabase
    .from("sites")
    .select("user_id")
    .eq("id", body.site_id)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      site_id: body.site_id,
      user_id: site.user_id,
      company_name: body.company_name || "",
      contact_name: body.contact_name || "",
      email: body.email || "",
      whatsapp: body.whatsapp || "",
      product_type: body.product_type || "",
      clamping_force: body.clamping_force || "",
      application: body.application || "",
      quantity: body.quantity || "",
      port: body.port || "",
      message: body.message || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
