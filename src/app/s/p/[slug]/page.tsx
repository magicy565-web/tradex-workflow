import { createClient } from "@supabase/supabase-js";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const client = createClient(supabaseUrl, serviceKey);

  const { data } = await client
    .from("geo_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("page_type", "product")
    .single();

  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tradex.com";

  return {
    title: page.title,
    description: page.meta_description || page.title,
    openGraph: {
      title: page.title,
      description: page.meta_description || page.title,
      url: `${baseUrl}/s/p/${slug}`,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProductPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const specs = (page.structured_specs || []) as { key: string; value: string; unit?: string }[];
  const trustSignals = (page.trust_signals || []) as { type: string; name: string; issuer?: string; number?: string }[];
  const faq = (page.faq || []) as { question: string; answer: string }[];
  const hero = (page.hero_content || {}) as Record<string, unknown>;
  const jsonld = page.jsonld || {};
  const faqJsonLd = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tradex.com";

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }}
        />
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        )}
      </head>
      <body className="bg-white text-gray-900 font-sans">
        <header className="border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-sm font-semibold text-indigo-600">TradeX</a>
            <span className="text-xs text-gray-400">Verified Supply Chain</span>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6">
            <a href="/" className="hover:text-indigo-600">Home</a>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{page.title}</span>
          </nav>

          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Gallery */}
            <div className="bg-gray-50 rounded-lg aspect-square flex items-center justify-center text-gray-400 text-sm">
              {page.gallery && (page.gallery as string[]).length > 0 ? (
                <img
                  src={(page.gallery as string[])[0]}
                  alt={page.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span>Product Image</span>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-2xl font-bold mb-3">{page.title}</h1>
              {page.meta_description && (
                <p className="text-gray-600 mb-4">{page.meta_description}</p>
              )}

              <div className="space-y-2 mb-6">
                {hero.moq ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500 w-28">MOQ:</span>
                    <span>{String(hero.moq)} pcs</span>
                  </div>
                ) : null}
                {hero.lead_time_days ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500 w-28">Lead Time:</span>
                    <span>{String(hero.lead_time_days)} days</span>
                  </div>
                ) : null}
                {hero.price_range && typeof hero.price_range === "object" ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500 w-28">Price Range:</span>
                    <span>
                      ${String((hero.price_range as Record<string, unknown>).low)} - $
                      {String((hero.price_range as Record<string, unknown>).high)}
                    </span>
                  </div>
                ) : null}
              </div>

              {trustSignals.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {trustSignals.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="space-y-3 p-5 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Interested in this product?</p>
                <a
                  href="#inquiry-form"
                  className="block w-full text-center py-2.5 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Request Quote
                </a>
                <a
                  href="#inquiry-form"
                  className="block w-full text-center py-2.5 px-4 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                >
                  Request Sample
                </a>
              </div>
            </div>
          </div>

          {/* Specifications */}
          {specs.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                Product Specifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {specs.map((s, i) => (
                  <div key={i} className="flex py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 w-40 shrink-0">{s.key}</span>
                    <span className="text-sm font-medium">
                      {s.value}
                      {s.unit ? ` ${s.unit}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          {faq.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faq.map((f, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-sm mb-2">{f.question}</h3>
                    <p className="text-sm text-gray-600">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Inquiry Form */}
          <section id="inquiry-form" className="mb-12">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
              Submit Inquiry
            </h2>
            <InquiryForm pageSlug={slug} baseUrl={baseUrl} />
          </section>
        </main>

        <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
          Powered by TradeX Supply Chain Platform
        </footer>

        {/* Tracking Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                fetch('/api/public/track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    page_slug: '${slug}',
                    event: 'page_view',
                    referrer: document.referrer || '',
                    utm: Object.fromEntries(new URLSearchParams(location.search)),
                  }),
                  keepalive: true,
                }).catch(function() {});
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

function InquiryForm({ pageSlug, baseUrl }: { pageSlug: string; baseUrl: string }) {
  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl"
      method="POST"
      action={`${baseUrl}/api/public/inquiry`}
    >
      <input type="hidden" name="page_slug" value={pageSlug} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          name="contact_name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          name="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
        <input
          type="text"
          name="company_name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <input
          type="text"
          name="country"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Type</label>
        <select
          name="inquiry_type"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="wholesale">Wholesale</option>
          <option value="oem">OEM</option>
          <option value="odm">ODM</option>
          <option value="sample">Sample Request</option>
          <option value="distribution">Distribution</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Quantity</label>
        <input
          type="text"
          name="quantity_estimate"
          placeholder="e.g. 500-1000 pcs"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          name="message"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Submit Inquiry
        </button>
      </div>
    </form>
  );
}
