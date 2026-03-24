import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

// POST /api/supply/sellers/register - Register a new Shopify seller (called on app install)
export async function POST(request: Request) {
  // This endpoint uses a shared install secret for initial registration
  const installSecret = request.headers.get("X-TradeX-Install-Secret");

  if (!installSecret || installSecret !== process.env.TRADEX_INSTALL_SECRET) {
    return NextResponse.json({ error: "Invalid install secret" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.shop_domain) {
    return NextResponse.json({ error: "shop_domain is required" }, { status: 400 });
  }

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generate API credentials
  const apiKey = `txk_${randomBytes(24).toString("hex")}`;
  const apiSecret = `txs_${randomBytes(32).toString("hex")}`;

  // Check if seller already exists
  const { data: existing } = await adminClient
    .from("shopify_sellers")
    .select("id, api_key")
    .eq("shop_domain", body.shop_domain)
    .maybeSingle();

  if (existing) {
    // Seller already registered, return existing credentials
    return NextResponse.json({
      id: existing.id,
      api_key: existing.api_key,
      message: "Seller already registered",
    });
  }

  const { data, error } = await adminClient
    .from("shopify_sellers")
    .insert({
      shop_domain: body.shop_domain,
      shop_name: body.shop_name || null,
      email: body.email || null,
      api_key: apiKey,
      api_secret: apiSecret,
      access_token: body.access_token || null,
      app_installed: true,
      metadata: body.metadata || {},
    })
    .select("id, api_key, api_secret, shop_domain")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
