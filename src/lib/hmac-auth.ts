import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC-SHA256 authentication middleware for Shopify App API requests.
 *
 * Validates requests using:
 * - X-TradeX-Key: the seller's api_key
 * - X-TradeX-Signature: HMAC-SHA256(request_body, api_secret)
 * - X-TradeX-Timestamp: Unix timestamp (request must be within 5 min)
 *
 * Returns the seller record if authentication succeeds.
 */

const MAX_REQUEST_AGE_MS = 5 * 60 * 1000; // 5 minutes

function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface HmacAuthResult {
  success: true;
  seller: {
    id: string;
    shop_domain: string;
    shop_name: string | null;
    email: string | null;
    plan: string;
  };
  adminClient: ReturnType<typeof createAdminClient>;
}

export interface HmacAuthError {
  success: false;
  response: NextResponse;
}

export type HmacAuthOutcome = HmacAuthResult | HmacAuthError;

export async function verifyHmacAuth(request: Request): Promise<HmacAuthOutcome> {
  const apiKey = request.headers.get("X-TradeX-Key");
  const signature = request.headers.get("X-TradeX-Signature");
  const timestamp = request.headers.get("X-TradeX-Timestamp");

  if (!apiKey || !signature) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Missing authentication headers (X-TradeX-Key, X-TradeX-Signature)" },
        { status: 401 }
      ),
    };
  }

  // Validate timestamp to prevent replay attacks
  if (timestamp) {
    const requestTime = parseInt(timestamp, 10) * 1000;
    const now = Date.now();
    if (Math.abs(now - requestTime) > MAX_REQUEST_AGE_MS) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Request timestamp expired" },
          { status: 401 }
        ),
      };
    }
  }

  // Look up the seller by api_key
  const adminClient = createAdminClient();
  const { data: seller, error } = await adminClient
    .from("shopify_sellers")
    .select("id, shop_domain, shop_name, email, plan, api_secret, app_installed")
    .eq("api_key", apiKey)
    .single();

  if (error || !seller) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      ),
    };
  }

  if (!seller.app_installed) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "App is not installed for this shop" },
        { status: 403 }
      ),
    };
  }

  // Verify HMAC signature
  // For GET requests, sign the full URL; for POST/PUT, sign the body
  let payload: string;
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "DELETE") {
    const url = new URL(request.url);
    payload = url.pathname + url.search + (timestamp || "");
  } else {
    const body = await request.clone().text();
    payload = body + (timestamp || "");
  }

  const expectedSignature = createHmac("sha256", seller.api_secret)
    .update(payload)
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Invalid signature" },
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

  // Strip sensitive fields before returning
  const { api_secret: _secret, app_installed: _installed, ...sellerPublic } = seller;

  return {
    success: true,
    seller: sellerPublic,
    adminClient,
  };
}
