/**
 * Bridge API: Sync Products from Factory System → TradeX
 *
 * POST — Batch sync factory products into supply_products.
 *
 * Maps node_product records from factory-digital-archive-agent
 * into TradeX supply_products, linking via factory_supplier_links.
 */

import { NextResponse } from "next/server";
import { verifyBridgeAuth, logBridgeSync } from "@/lib/bridge-auth";

interface FactoryProductPayload {
  factory_product_id: string;    // node_product.id or product_code
  factory_id: string;            // factories.id
  title: string;                 // product_name
  title_zh?: string;
  description?: string;
  category?: string;
  images?: string[];
  sku?: string;
  supply_price: number;
  msrp?: number;
  currency?: string;
  moq?: number;
  lead_time_days?: number;
  stock_quantity?: number;
  specs?: Array<{ label: string; value: string }>;
  variants?: Array<{ name: string; options: string[]; prices: number[] }>;
  weight_kg?: number;
  dimensions?: { length: number; width: number; height: number; unit: string };
  origin_country?: string;
  hs_code?: string;
  status?: "draft" | "active";
}

export async function POST(request: Request) {
  const auth = await verifyBridgeAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;

  let body: { products: FactoryProductPayload[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
    return NextResponse.json(
      { error: "products array is required and must not be empty" },
      { status: 400 }
    );
  }

  if (body.products.length > 100) {
    return NextResponse.json(
      { error: "Maximum 100 products per batch" },
      { status: 400 }
    );
  }

  // Collect unique factory_ids and resolve their TradeX user_ids
  const factoryIds = [...new Set(body.products.map((p) => p.factory_id))];
  const { data: links, error: linkError } = await adminClient
    .from("factory_supplier_links")
    .select("factory_id, user_id")
    .in("factory_id", factoryIds);

  if (linkError) {
    return NextResponse.json(
      { error: "Failed to resolve factory links", detail: linkError.message },
      { status: 500 }
    );
  }

  const factoryToUser = new Map<string, string>();
  for (const link of links || []) {
    factoryToUser.set(link.factory_id, link.user_id);
  }

  // Check for unlinked factories
  const unlinked = factoryIds.filter((fid) => !factoryToUser.has(fid));
  if (unlinked.length > 0) {
    return NextResponse.json(
      {
        error: "Some factories are not linked to TradeX suppliers",
        unlinked_factory_ids: unlinked,
      },
      { status: 400 }
    );
  }

  // Process products: upsert by factory_product_id
  const results: { synced: number; errors: Array<{ factory_product_id: string; error: string }> } = {
    synced: 0,
    errors: [],
  };

  for (const product of body.products) {
    const userId = factoryToUser.get(product.factory_id)!;

    // Check if product already exists by factory_product_id
    const { data: existing } = await adminClient
      .from("supply_products")
      .select("id")
      .eq("factory_product_id", product.factory_product_id)
      .eq("user_id", userId)
      .maybeSingle();

    const record = {
      user_id: userId,
      factory_id: product.factory_id,
      factory_product_id: product.factory_product_id,
      source: "factory_sync" as const,
      title: product.title,
      title_zh: product.title_zh || null,
      description: product.description || null,
      category: product.category || null,
      images: product.images || [],
      sku: product.sku || null,
      supply_price: product.supply_price,
      msrp: product.msrp || null,
      currency: product.currency || "USD",
      moq: product.moq ?? 1,
      lead_time_days: product.lead_time_days ?? 7,
      stock_quantity: product.stock_quantity ?? 0,
      specs: product.specs || [],
      variants: product.variants || [],
      weight_kg: product.weight_kg || null,
      dimensions: product.dimensions || null,
      origin_country: product.origin_country || "CN",
      hs_code: product.hs_code || null,
      status: product.status || "draft",
    };

    let opError: string | null = null;

    if (existing) {
      // Update existing product
      const { error } = await adminClient
        .from("supply_products")
        .update(record)
        .eq("id", existing.id);
      if (error) opError = error.message;
    } else {
      // Insert new product
      const { error } = await adminClient
        .from("supply_products")
        .insert(record);
      if (error) opError = error.message;
    }

    if (opError) {
      results.errors.push({ factory_product_id: product.factory_product_id, error: opError });
    } else {
      results.synced++;
    }
  }

  // Update sync status on factory links
  for (const factoryId of factoryIds) {
    await adminClient
      .from("factory_supplier_links")
      .update({ sync_status: "synced", last_synced_at: new Date().toISOString() })
      .eq("factory_id", factoryId);
  }

  await logBridgeSync(adminClient, {
    direction: "factory_to_tradex",
    entity_type: "product",
    action: "sync",
    status: results.errors.length > 0 ? (results.synced > 0 ? "partial" : "failed") : "success",
    details: {
      total: body.products.length,
      synced: results.synced,
      errors: results.errors.length,
      factory_ids: factoryIds,
    },
  });

  return NextResponse.json({
    synced: results.synced,
    total: body.products.length,
    errors: results.errors,
  });
}
