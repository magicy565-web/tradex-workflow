import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  calculateContentScore,
  generateSlug,
  generateProductJsonLd,
  generateFactoryJsonLd,
} from "@/lib/geo-utils";

/**
 * POST /api/geo/pages/generate — Auto-generate GEO page from product or factory data
 *
 * Body: { entity_id: string, page_type: "product" | "factory" }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { entity_id, page_type } = body;

  if (!entity_id || !page_type) {
    return NextResponse.json(
      { error: "entity_id and page_type are required" },
      { status: 400 }
    );
  }

  // Check if page already exists for this entity
  const { data: existingPage } = await supabase
    .from("geo_pages")
    .select("id, slug, status")
    .eq("entity_id", entity_id)
    .eq("page_type", page_type)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPage) {
    return NextResponse.json({
      message: "Page already exists for this entity",
      page_id: existingPage.id,
      slug: existingPage.slug,
      already_existed: true,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tradex.com";

  if (page_type === "product") {
    return await generateProductPage(supabase, user.id, entity_id, baseUrl);
  } else if (page_type === "factory") {
    return await generateFactoryPage(supabase, user.id, entity_id, baseUrl);
  }

  return NextResponse.json({ error: "Invalid page_type" }, { status: 400 });
}

async function generateProductPage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entityId: string,
  baseUrl: string,
) {
  // Fetch product data
  const { data: product, error: prodErr } = await supabase
    .from("supply_products")
    .select("*")
    .eq("id", entityId)
    .eq("user_id", userId)
    .single();

  if (prodErr || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Fetch price tiers
  const { data: tiers } = await supabase
    .from("supply_price_tiers")
    .select("min_quantity, max_quantity, unit_price")
    .eq("product_id", entityId)
    .order("min_quantity", { ascending: true });

  // Build structured specs from product data
  const specs = [];
  if (product.category) specs.push({ key: "Category", value: product.category });
  if (product.sku) specs.push({ key: "SKU", value: product.sku });
  if (product.min_order_quantity) specs.push({ key: "MOQ", value: String(product.min_order_quantity), unit: "pcs" });
  if (product.lead_time_days) specs.push({ key: "Lead Time", value: String(product.lead_time_days), unit: "days" });
  if (product.weight) specs.push({ key: "Weight", value: String(product.weight), unit: "kg" });

  // Extract specs from metadata if available
  const meta = product.metadata || {};
  if (meta.material) specs.push({ key: "Material", value: String(meta.material) });
  if (meta.dimensions) specs.push({ key: "Dimensions", value: String(meta.dimensions) });
  if (meta.color) specs.push({ key: "Color", value: String(meta.color) });

  // Build price range
  let priceRange = undefined;
  if (tiers && tiers.length > 0) {
    const prices = tiers.map((t: { unit_price: number }) => Number(t.unit_price));
    priceRange = {
      low: Math.min(...prices),
      high: Math.max(Number(product.supply_price), ...prices),
      currency: "USD",
    };
  } else if (product.supply_price) {
    priceRange = {
      low: Number(product.supply_price),
      high: Number(product.supply_price),
      currency: "USD",
    };
  }

  // Build trust signals from metadata
  const trustSignals = [];
  if (meta.certifications && Array.isArray(meta.certifications)) {
    for (const cert of meta.certifications) {
      trustSignals.push({
        type: "certification" as const,
        name: typeof cert === "string" ? cert : cert.name || "Certification",
        issuer: typeof cert === "object" ? cert.issuer : undefined,
        number: typeof cert === "object" ? cert.number : undefined,
      });
    }
  }

  // Generate default FAQ
  const faq = [
    {
      question: `What is the MOQ for ${product.title}?`,
      answer: product.min_order_quantity
        ? `The minimum order quantity is ${product.min_order_quantity} pieces.`
        : "Please contact us for minimum order quantity details.",
    },
    {
      question: `What is the lead time for ${product.title}?`,
      answer: product.lead_time_days
        ? `Standard lead time is ${product.lead_time_days} days after order confirmation.`
        : "Lead time depends on order quantity. Please inquire for details.",
    },
    {
      question: `Can I get a sample of ${product.title}?`,
      answer: "Yes, samples are available. Please submit an inquiry to request samples.",
    },
  ];

  const title = product.title;
  const description = product.description || `${product.title} — factory direct supply with verified quality.`;
  const slug = generateSlug(title, entityId);

  // Ensure slug uniqueness
  const { data: existingSlug } = await supabase
    .from("geo_pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

  const jsonld = generateProductJsonLd({
    title,
    description,
    specs,
    trustSignals,
    faq,
    priceRange,
    slug: finalSlug,
    baseUrl,
  });

  const gallery = product.images || [];

  const { total, breakdown } = calculateContentScore({
    title,
    meta_description: description,
    structured_specs: specs,
    trust_signals: trustSignals,
    faq,
    gallery,
    factory_profile: {},
    page_type: "product",
  });

  const { data, error } = await supabase
    .from("geo_pages")
    .insert({
      user_id: userId,
      page_type: "product",
      entity_id: entityId,
      slug: finalSlug,
      title,
      meta_description: description.slice(0, 160),
      hero_content: {
        supply_price: product.supply_price,
        price_range: priceRange,
        moq: product.min_order_quantity,
        lead_time_days: product.lead_time_days,
      },
      structured_specs: specs,
      trust_signals: trustSignals,
      faq,
      gallery,
      factory_profile: {},
      jsonld,
      content_score: total,
      score_breakdown: breakdown,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ...data, generated: true }, { status: 201 });
}

async function generateFactoryPage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entityId: string,
  baseUrl: string,
) {
  // Fetch factory link data
  const { data: link, error: linkErr } = await supabase
    .from("factory_supplier_links")
    .select("*")
    .eq("id", entityId)
    .eq("user_id", userId)
    .single();

  if (linkErr || !link) {
    return NextResponse.json({ error: "Factory link not found" }, { status: 404 });
  }

  const factoryProfile: Record<string, unknown> = {};
  const meta = link.metadata || {};
  if (meta.annual_output) factoryProfile.annual_output = meta.annual_output;
  if (meta.established_year) factoryProfile.established_year = meta.established_year;
  if (meta.workers) factoryProfile.workers = meta.workers;
  if (meta.production_lines) factoryProfile.production_lines = meta.production_lines;

  const trustSignals = [];
  if (meta.certifications && Array.isArray(meta.certifications)) {
    for (const cert of meta.certifications) {
      trustSignals.push({
        type: "certification" as const,
        name: typeof cert === "string" ? cert : cert.name || "Certification",
        issuer: typeof cert === "object" ? cert.issuer : undefined,
      });
    }
  }

  // Add trust score as verification signal
  if (link.trust_score) {
    trustSignals.push({
      type: "verification" as const,
      name: `TradeX Verified — Trust Score ${link.trust_score}/100`,
      issuer: "TradeX",
    });
  }

  const title = link.factory_name || `Factory ${entityId.slice(0, 8)}`;
  const description = meta.description || `${title} — verified manufacturer on TradeX supply chain platform.`;

  const faq = [
    {
      question: `Is ${title} a verified manufacturer?`,
      answer: link.trust_score
        ? `Yes, ${title} is verified on TradeX with a trust score of ${link.trust_score}/100.`
        : `${title} is registered on TradeX supply chain platform.`,
    },
    {
      question: `How can I order from ${title}?`,
      answer: "You can subscribe to their products directly through TradeX, or submit an inquiry for bulk orders.",
    },
  ];

  const slug = generateSlug(title, entityId);
  const { data: existingSlug } = await supabase
    .from("geo_pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

  const jsonld = generateFactoryJsonLd({
    name: title,
    description,
    country: (meta.country as string) || "CN",
    profile: factoryProfile,
    trustSignals,
    slug: finalSlug,
    baseUrl,
  });

  const { total, breakdown } = calculateContentScore({
    title,
    meta_description: description,
    structured_specs: [],
    trust_signals: trustSignals,
    faq,
    gallery: [],
    factory_profile: factoryProfile,
    page_type: "factory",
  });

  const { data, error } = await supabase
    .from("geo_pages")
    .insert({
      user_id: userId,
      page_type: "factory",
      entity_id: entityId,
      slug: finalSlug,
      title,
      meta_description: description.slice(0, 160),
      hero_content: { trust_score: link.trust_score },
      structured_specs: [],
      trust_signals: trustSignals,
      faq,
      gallery: [],
      factory_profile: factoryProfile,
      jsonld,
      content_score: total,
      score_breakdown: breakdown,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ...data, generated: true }, { status: 201 });
}
