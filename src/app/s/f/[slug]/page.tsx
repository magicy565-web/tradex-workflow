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
    .eq("page_type", "factory")
    .single();

  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tradex.com";

  return {
    title: `${page.title} — Verified Manufacturer`,
    description: page.meta_description || `${page.title} — verified manufacturer on TradeX.`,
    openGraph: {
      title: page.title,
      description: page.meta_description || page.title,
      url: `${baseUrl}/s/f/${slug}`,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicFactoryPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const trustSignals = (page.trust_signals || []) as { type: string; name: string; issuer?: string }[];
  const faq = (page.faq || []) as { question: string; answer: string }[];
  const profile = (page.factory_profile || {}) as Record<string, unknown>;
  const hero = (page.hero_content || {}) as Record<string, unknown>;
  const jsonld = page.jsonld || {};

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tradex.com";

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }}
        />
      </head>
      <body className="bg-white text-gray-900 font-sans">
        <header className="border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-sm font-semibold text-indigo-600">TradeX</a>
            <span className="text-xs text-gray-400">Verified Supply Chain</span>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">{page.title}</h1>
            {page.meta_description && (
              <p className="text-gray-600">{page.meta_description}</p>
            )}
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {hero.trust_score ? (
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-emerald-700">{String(hero.trust_score)}</div>
                <div className="text-xs text-emerald-600 mt-1">Trust Score</div>
              </div>
            ) : null}
            {profile.established_year ? (
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">{String(profile.established_year)}</div>
                <div className="text-xs text-blue-600 mt-1">Established</div>
              </div>
            ) : null}
            {profile.workers ? (
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-700">{String(profile.workers)}+</div>
                <div className="text-xs text-purple-600 mt-1">Workers</div>
              </div>
            ) : null}
            {profile.annual_output ? (
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-700">{String(profile.annual_output)}</div>
                <div className="text-xs text-amber-600 mt-1">Annual Output</div>
              </div>
            ) : null}
          </div>

          {/* Certifications */}
          {trustSignals.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                Certifications & Verification
              </h2>
              <div className="flex flex-wrap gap-3">
                {trustSignals.map((t, i) => (
                  <div
                    key={i}
                    className="px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="text-sm font-medium">{t.name}</div>
                    {t.issuer && (
                      <div className="text-xs text-gray-500 mt-0.5">Issued by {t.issuer}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Factory Capabilities */}
          {Object.keys(profile).length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                Factory Capabilities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {Object.entries(profile).map(([key, value]) => (
                  <div key={key} className="flex py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 w-40 shrink-0 capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          {faq.length > 0 && (
            <section className="mb-10">
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

          {/* Contact CTA */}
          <section className="p-6 bg-indigo-50 rounded-xl border border-indigo-100 mb-10">
            <h2 className="text-lg font-semibold mb-2">Work with {page.title}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Interested in sourcing from this manufacturer? Submit an inquiry or subscribe to their products.
            </p>
            <div className="flex gap-3">
              <a
                href="#inquiry-form"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Submit Inquiry
              </a>
            </div>
          </section>

          {/* Inquiry Form */}
          <section id="inquiry-form" className="mb-12">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
              Contact This Manufacturer
            </h2>
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl"
              method="POST"
              action={`${baseUrl}/api/public/inquiry`}
            >
              <input type="hidden" name="page_slug" value={slug} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" name="contact_name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" name="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input type="text" name="company_name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" name="country" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea name="message" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Submit Inquiry
                </button>
              </div>
            </form>
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
