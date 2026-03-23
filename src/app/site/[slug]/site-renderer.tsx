"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Mail,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  Award,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SiteData {
  hero: {
    tagline: string;
    headline: string;
    subheadline: string;
    cta_primary: string;
    cta_secondary: string;
  };
  products: {
    name: string;
    description: string;
    specs: { label: string; value: string }[];
  }[];
  why_us: { title: string; description: string; stat: string }[];
  faq: { question: string; answer: string }[];
  seo: { title: string; description: string; keywords: string[] };
  about: { headline: string; paragraphs: string[]; certifications: string[] };
}

interface Props {
  siteData: SiteData;
  companyName: string;
  companyNameEn: string;
  contactEmail: string;
  contactWhatsapp: string;
  siteId: string;
}

/* ------------------------------------------------------------------ */
/*  FAQ Accordion                                                      */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
      >
        {q}
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-gray-600">{a}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RFQ Form                                                           */
/* ------------------------------------------------------------------ */

function RfqForm({ siteId }: { siteId: string }) {
  const [form, setForm] = useState({
    contact_name: "",
    company_name: "",
    email: "",
    whatsapp: "",
    product_type: "",
    clamping_force: "",
    quantity: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, site_id: siteId }),
      });
      setSubmitted(true);
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Thank You for Your Inquiry!
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          We have received your request and our team will get back to you within
          24 hours.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          placeholder="Your Name *"
          className={inputClass}
          value={form.contact_name}
          onChange={(e) => update("contact_name", e.target.value)}
        />
        <input
          placeholder="Company Name"
          className={inputClass}
          value={form.company_name}
          onChange={(e) => update("company_name", e.target.value)}
        />
        <input
          required
          type="email"
          placeholder="Email Address *"
          className={inputClass}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <input
          placeholder="WhatsApp Number"
          className={inputClass}
          value={form.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
        />
        <input
          placeholder="Product of Interest"
          className={inputClass}
          value={form.product_type}
          onChange={(e) => update("product_type", e.target.value)}
        />
        <input
          placeholder="Clamping Force (e.g. 120T)"
          className={inputClass}
          value={form.clamping_force}
          onChange={(e) => update("clamping_force", e.target.value)}
        />
      </div>
      <input
        placeholder="Quantity"
        className={inputClass}
        value={form.quantity}
        onChange={(e) => update("quantity", e.target.value)}
      />
      <textarea
        rows={4}
        placeholder="Your Message / Requirements"
        className={inputClass + " resize-none"}
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
      />
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 w-full sm:w-auto"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {submitting ? "Submitting..." : "Submit Inquiry"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Site Renderer                                                 */
/* ------------------------------------------------------------------ */

export default function SiteRenderer({
  siteData,
  companyName,
  companyNameEn,
  contactEmail,
  contactWhatsapp,
  siteId,
}: Props) {
  const d = siteData;

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* ---- Nav ---- */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold">{companyNameEn}</span>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#products" className="hover:text-gray-900 transition-colors">Products</a>
            <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
            <a
              href="#quote"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Get a Quote
            </a>
          </div>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
            {d.hero.tagline}
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            {d.hero.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-indigo-100">
            {d.hero.subheadline}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#quote"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-gray-50 transition-colors"
            >
              {d.hero.cta_primary}
            </a>
            <a
              href="#products"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              {d.hero.cta_secondary}
            </a>
          </div>
        </div>
      </section>

      {/* ---- Products ---- */}
      <section id="products" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Our Products
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-500">
            Industry-leading injection molding solutions tailored to your needs
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {d.products.map((product, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-white p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                  <Globe className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {product.name}
                </h3>
                <p className="mt-1.5 text-sm text-gray-500">
                  {product.description}
                </p>
                {product.specs.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {product.specs.map((spec, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-500">{spec.label}</span>
                        <span className="font-medium text-gray-800">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Why Us ---- */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Why Choose Us
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {d.why_us.map((item, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                  <Check className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  {item.stat}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- About ---- */}
      <section id="about" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            {d.about.headline}
          </h2>
          <div className="mt-8 space-y-4">
            {d.about.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-gray-600">
                {p}
              </p>
            ))}
          </div>
          {d.about.certifications.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {d.about.certifications.map((cert, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700"
                >
                  <Award className="h-3.5 w-3.5 text-indigo-500" />
                  {cert}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section id="faq" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 rounded-xl border border-gray-200 bg-white px-6">
            {d.faq.map((item, i) => (
              <FaqItem key={i} q={item.question} a={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- RFQ Form ---- */}
      <section id="quote" className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Get a Free Quote</h2>
          <p className="mt-2 text-sm text-gray-500">
            Fill in the form below and our team will respond within 24 hours
          </p>
          <div className="mt-10">
            <RfqForm siteId={siteId} />
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="bg-gray-900 px-6 py-10 text-center text-gray-400">
        <p className="text-base font-semibold text-white">{companyNameEn}</p>
        <p className="mt-1 text-sm">{companyName}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
          {contactEmail && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {contactEmail}
            </span>
          )}
          {contactWhatsapp && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {contactWhatsapp}
            </span>
          )}
        </div>
        <p className="mt-6 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} {companyNameEn}. All rights
          reserved.
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Powered by{" "}
          <a href="/" className="text-indigo-400 hover:underline">
            TradeX
          </a>
        </p>
      </footer>
    </div>
  );
}
