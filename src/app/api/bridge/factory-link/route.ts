/**
 * Bridge API: Factory ↔ Supplier Link Management
 *
 * POST — Create/update a factory-supplier link
 * GET  — Look up link by factory_id or user_id
 *
 * Called by factory-digital-archive-agent when a factory onboards to TradeX.
 */

import { NextResponse } from "next/server";
import { verifyBridgeAuth, logBridgeSync } from "@/lib/bridge-auth";

export async function POST(request: Request) {
  const auth = await verifyBridgeAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    factory_id,
    factory_short_id,
    user_id,
    factory_name,
    factory_region,
    trust_score,
    trust_dimensions,
    metadata,
  } = body as {
    factory_id: string;
    factory_short_id?: string;
    user_id: string;
    factory_name?: string;
    factory_region?: string;
    trust_score?: number;
    trust_dimensions?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };

  if (!factory_id || !user_id) {
    return NextResponse.json(
      { error: "factory_id and user_id are required" },
      { status: 400 }
    );
  }

  // Upsert the link (on conflict with factory_id)
  const { data, error } = await adminClient
    .from("factory_supplier_links")
    .upsert(
      {
        factory_id,
        factory_short_id: factory_short_id || null,
        user_id,
        factory_name: factory_name || null,
        factory_region: factory_region || null,
        trust_score: trust_score ?? null,
        trust_dimensions: trust_dimensions || null,
        metadata: metadata || {},
        sync_status: "linked",
      },
      { onConflict: "factory_id" }
    )
    .select("id, factory_id, user_id, factory_name, sync_status, created_at")
    .single();

  if (error) {
    await logBridgeSync(adminClient, {
      direction: "factory_to_tradex",
      entity_type: "factory_link",
      entity_id: factory_id,
      action: "upsert",
      status: "failed",
      details: { error: error.message },
    });
    return NextResponse.json(
      { error: "Failed to create factory link", detail: error.message },
      { status: 500 }
    );
  }

  await logBridgeSync(adminClient, {
    direction: "factory_to_tradex",
    entity_type: "factory_link",
    entity_id: factory_id,
    action: "upsert",
    status: "success",
    details: { user_id, factory_name },
  });

  return NextResponse.json({ data });
}

export async function GET(request: Request) {
  const auth = await verifyBridgeAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;
  const url = new URL(request.url);
  const factoryId = url.searchParams.get("factory_id");
  const userId = url.searchParams.get("user_id");

  if (!factoryId && !userId) {
    return NextResponse.json(
      { error: "Provide factory_id or user_id query parameter" },
      { status: 400 }
    );
  }

  let query = adminClient
    .from("factory_supplier_links")
    .select("*");

  if (factoryId) query = query.eq("factory_id", factoryId);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Lookup failed", detail: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ data: null, linked: false });
  }

  return NextResponse.json({ data, linked: true });
}
