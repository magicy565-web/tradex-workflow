import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/geo/pages/generate-batch — Batch generate GEO pages
 *
 * Generates pages for all products/factories that don't already have one.
 * Body: { page_type: "product" | "factory" }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { page_type } = body;

  if (!page_type || !["product", "factory"].includes(page_type)) {
    return NextResponse.json({ error: "page_type must be 'product' or 'factory'" }, { status: 400 });
  }

  // Get existing entity IDs that already have GEO pages
  const { data: existingPages } = await supabase
    .from("geo_pages")
    .select("entity_id")
    .eq("user_id", user.id)
    .eq("page_type", page_type);

  const existingEntityIds = new Set((existingPages || []).map((p) => p.entity_id));

  // Get all entities
  let entities: { id: string }[] = [];
  if (page_type === "product") {
    const { data } = await supabase
      .from("supply_products")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active");
    entities = data || [];
  } else {
    const { data } = await supabase
      .from("factory_supplier_links")
      .select("id")
      .eq("user_id", user.id);
    entities = data || [];
  }

  // Filter out already-generated entities
  const toGenerate = entities.filter((e) => !existingEntityIds.has(e.id));

  if (toGenerate.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "All entities already have GEO pages",
      generated: 0,
      total: entities.length,
    });
  }

  // Generate pages via internal API calls (reuse generate endpoint logic)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  let generated = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process in batches of 5 to avoid overwhelming the DB
  for (let i = 0; i < toGenerate.length; i += 5) {
    const batch = toGenerate.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async (entity) => {
        const res = await fetch(`${baseUrl}/api/geo/pages/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") || "",
          },
          body: JSON.stringify({ entity_id: entity.id, page_type }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `Failed for ${entity.id}`);
        }
        return res.json();
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") generated++;
      else {
        failed++;
        errors.push(r.reason?.message || "Unknown error");
      }
    }
  }

  return NextResponse.json({
    ok: true,
    generated,
    failed,
    total_entities: entities.length,
    already_existed: existingEntityIds.size,
    errors: errors.slice(0, 10),
  });
}
