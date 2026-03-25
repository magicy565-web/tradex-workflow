/**
 * Bridge authentication for factory-digital-archive-agent → TradeX API calls.
 *
 * Uses a shared secret (BRIDGE_API_SECRET) with HMAC-SHA256 signing.
 * The factory system signs requests with this secret, and TradeX verifies them.
 */

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const MAX_REQUEST_AGE_MS = 5 * 60 * 1000; // 5 minutes

function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface BridgeAuthResult {
  success: true;
  adminClient: ReturnType<typeof createAdminClient>;
  sourceSystem: string;
}

export interface BridgeAuthError {
  success: false;
  response: NextResponse;
}

export type BridgeAuthOutcome = BridgeAuthResult | BridgeAuthError;

/**
 * Verify incoming requests from factory-digital-archive-agent.
 *
 * Required headers:
 * - X-Bridge-Source: identifying the calling system (e.g. "factory-archive")
 * - X-Bridge-Signature: HMAC-SHA256(body + timestamp, BRIDGE_API_SECRET)
 * - X-Bridge-Timestamp: Unix timestamp
 */
export async function verifyBridgeAuth(request: Request): Promise<BridgeAuthOutcome> {
  const bridgeSecret = process.env.BRIDGE_API_SECRET;
  if (!bridgeSecret) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Bridge API not configured" },
        { status: 503 }
      ),
    };
  }

  const source = request.headers.get("X-Bridge-Source");
  const signature = request.headers.get("X-Bridge-Signature");
  const timestamp = request.headers.get("X-Bridge-Timestamp");

  if (!source || !signature || !timestamp) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Missing bridge auth headers (X-Bridge-Source, X-Bridge-Signature, X-Bridge-Timestamp)" },
        { status: 401 }
      ),
    };
  }

  // Validate timestamp
  const requestTime = parseInt(timestamp, 10) * 1000;
  if (isNaN(requestTime) || Math.abs(Date.now() - requestTime) > MAX_REQUEST_AGE_MS) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Request timestamp expired or invalid" },
        { status: 401 }
      ),
    };
  }

  // Compute expected signature
  const method = request.method.toUpperCase();
  let payload: string;
  if (method === "GET" || method === "DELETE") {
    const url = new URL(request.url);
    payload = url.pathname + url.search + timestamp;
  } else {
    const body = await request.clone().text();
    payload = body + timestamp;
  }

  const expectedSignature = createHmac("sha256", bridgeSecret)
    .update(payload)
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Invalid bridge signature" },
          { status: 401 }
        ),
      };
    }
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid signature format" },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    adminClient: createAdminClient(),
    sourceSystem: source,
  };
}

/**
 * Log a bridge sync event for audit trail.
 */
export async function logBridgeSync(
  adminClient: ReturnType<typeof createAdminClient>,
  entry: {
    direction: "factory_to_tradex" | "tradex_to_factory";
    entity_type: string;
    entity_id?: string;
    action: string;
    status?: "success" | "failed" | "partial";
    details?: Record<string, unknown>;
  }
): Promise<void> {
  await adminClient
    .from("bridge_sync_logs")
    .insert({
      direction: entry.direction,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      action: entry.action,
      status: entry.status || "success",
      details: entry.details || {},
    })
    .then(() => {});
}
