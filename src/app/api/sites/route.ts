import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/sites - List user's sites
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/sites - Create a new site
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Generate subdomain from English company name
  const subdomain = body.company_name_en
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

  const { data, error } = await supabase
    .from("sites")
    .insert({
      user_id: user.id,
      name: body.name || `${body.company_name} B2B站`,
      company_name: body.company_name,
      company_name_en: body.company_name_en,
      subdomain,
      products: body.products || [],
      target_markets: body.target_markets || [],
      selling_points: body.selling_points || "",
      contact_email: body.contact_email || "",
      contact_whatsapp: body.contact_whatsapp || "",
      site_data: body.site_data || {},
      status: "generating",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduct credits for site generation
  await supabase.rpc("deduct_credits", {
    p_user_id: user.id,
    p_amount: 20,
    p_action: "site_generation",
    p_description: `生成站点: ${body.company_name}`,
  });

  return NextResponse.json(data, { status: 201 });
}
