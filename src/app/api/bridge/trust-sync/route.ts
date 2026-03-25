/**
 * Bridge API: Trust Score Sync
 *
 * POST — Push updated trust scores from factory system → TradeX.
 *
 * The factory-digital-archive-agent computes 5-dimensional trust scores
 * (identity, completeness, compliance, responsiveness, activity).
 * This endpoint syncs those scores to the supplier's factory link in TradeX,
 * making them visible in the supply chain dashboard.
 */

import { NextResponse } from "next/server";
import { verifyBridgeAuth, logBridgeSync } from "@/lib/bridge-auth";

interface TrustSyncPayload {
  factory_id: string;
  trust_score: number;               // Overall score 0-100
  trust_dimensions: {
    identity_score?: number;
    completeness_score?: number;
    compliance_score?: number;
    responsiveness_score?: number;
    activity_score?: number;
    fulfillment_score?: number;
    trade_signal_score?: number;
    [key: string]: number | undefined;
  };
  trust_coverage?: number;            // How much data backs the score (0-1)
}

export async function POST(request: Request) {
  const auth = await verifyBridgeAuth(request);
  if (!auth.success) return auth.response;

  const { adminClient } = auth;

  let body: { updates: TrustSyncPayload[] } | TrustSyncPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Support both single and batch format
  const updates: TrustSyncPayload[] = "updates" in body
    ? body.updates
    : [body];

  if (updates.length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  if (updates.length > 200) {
    return NextResponse.json({ error: "Maximum 200 updates per batch" }, { status: 400 });
  }

  const results = { updated: 0, not_found: 0, errors: 0 };

  for (const update of updates) {
    if (!update.factory_id || update.trust_score == null) {
      results.errors++;
      continue;
    }

    const { error, count } = await adminClient
      .from("factory_supplier_links")
      .update({
        trust_score: update.trust_score,
        trust_dimensions: update.trust_dimensions,
        // Only update trust fields; metadata is preserved
      })
      .eq("factory_id", update.factory_id);

    if (error) {
      results.errors++;
    } else if (count === 0) {
      results.not_found++;
    } else {
      results.updated++;
    }
  }

  await logBridgeSync(adminClient, {
    direction: "factory_to_tradex",
    entity_type: "trust_score",
    action: "sync",
    status: results.errors > 0 ? "partial" : "success",
    details: {
      total: updates.length,
      updated: results.updated,
      not_found: results.not_found,
      errors: results.errors,
    },
  });

  return NextResponse.json(results);
}
