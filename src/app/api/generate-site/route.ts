import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// The structured JSON schema we want OpenAI to produce
const SITE_SCHEMA = {
  type: "object" as const,
  properties: {
    hero: {
      type: "object" as const,
      properties: {
        tagline: { type: "string" as const, description: "Short uppercase tagline in English, 5-8 words" },
        headline: { type: "string" as const, description: "Main headline in English, the company's value proposition" },
        subheadline: { type: "string" as const, description: "Supporting text in English, 1-2 sentences" },
        cta_primary: { type: "string" as const, description: "Primary CTA button text in English" },
        cta_secondary: { type: "string" as const, description: "Secondary CTA button text in English" },
      },
      required: ["tagline", "headline", "subheadline", "cta_primary", "cta_secondary"],
    },
    products: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const, description: "Product name in English" },
          description: { type: "string" as const, description: "Short product description in English, 1 sentence" },
          specs: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                label: { type: "string" as const },
                value: { type: "string" as const },
              },
              required: ["label", "value"],
            },
            description: "3-5 key technical specifications",
          },
        },
        required: ["name", "description", "specs"],
      },
      description: "Product list with specs, 3-6 products",
    },
    why_us: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const, description: "Short title in English" },
          description: { type: "string" as const, description: "1 sentence explanation in English" },
          stat: { type: "string" as const, description: "A compelling number or stat, e.g. '20+ Years', '50+ Countries'" },
        },
        required: ["title", "description", "stat"],
      },
      description: "4 reasons to choose this company",
    },
    faq: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          question: { type: "string" as const },
          answer: { type: "string" as const },
        },
        required: ["question", "answer"],
      },
      description: "5-6 frequently asked questions and answers in English, relevant to injection molding machine buyers",
    },
    seo: {
      type: "object" as const,
      properties: {
        title: { type: "string" as const, description: "SEO page title, 50-60 chars" },
        description: { type: "string" as const, description: "SEO meta description, 150-160 chars" },
        keywords: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "8-12 SEO keywords",
        },
      },
      required: ["title", "description", "keywords"],
    },
    about: {
      type: "object" as const,
      properties: {
        headline: { type: "string" as const },
        paragraphs: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "2-3 paragraphs about the company in English",
        },
        certifications: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "List of certifications like CE, ISO 9001, etc.",
        },
      },
      required: ["headline", "paragraphs", "certifications"],
    },
  },
  required: ["hero", "products", "why_us", "faq", "seo", "about"],
};

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    companyName,
    companyEnName,
    products,
    markets,
    sellingPoints,
    email,
    whatsapp,
  } = body;

  if (!companyName || !companyEnName) {
    return NextResponse.json(
      { error: "Company name and English name are required" },
      { status: 400 }
    );
  }

  const prompt = `You are an expert B2B website copywriter specializing in industrial machinery, specifically injection molding machines.

Generate complete website content for this company:

Company (Chinese): ${companyName}
Company (English): ${companyEnName}
Products: ${products?.join(", ") || "Injection Molding Machines"}
Target Markets: ${markets?.join(", ") || "Global"}
Selling Points: ${sellingPoints || "Professional manufacturer with years of experience"}
Contact Email: ${email || "N/A"}
WhatsApp: ${whatsapp || "N/A"}

Requirements:
- All content in English (this is a B2B export website targeting international buyers)
- Professional, trustworthy tone suitable for industrial equipment buyers
- Include specific technical details relevant to injection molding machines
- Products should include realistic technical specifications (clamping force, shot weight, etc.)
- FAQ should address common buyer concerns (MOQ, lead time, installation, payment terms, warranty)
- SEO optimized for injection molding machine related keywords`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "site_content",
          schema: SITE_SCHEMA,
          strict: true,
        },
      },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    const siteData = JSON.parse(content);

    // Save the generated site to database
    const subdomain = companyEnName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);

    const { data: site, error: dbError } = await supabase
      .from("sites")
      .insert({
        user_id: user.id,
        name: `${companyName} B2B站`,
        company_name: companyName,
        company_name_en: companyEnName,
        subdomain,
        products: products || [],
        target_markets: markets || [],
        selling_points: sellingPoints || "",
        contact_email: email || "",
        contact_whatsapp: whatsapp || "",
        site_data: siteData,
        status: "preview",
      })
      .select()
      .single();

    if (dbError) {
      // If DB save fails, still return the generated content
      console.error("DB save error:", dbError);
      return NextResponse.json({
        siteData,
        siteId: null,
        subdomain,
      });
    }

    // Deduct credits
    await supabase.rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: 20,
      p_action: "site_generation",
      p_description: `生成站点: ${companyName}`,
    });

    return NextResponse.json({
      siteData,
      siteId: site.id,
      subdomain,
    });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate site content" },
      { status: 500 }
    );
  }
}
