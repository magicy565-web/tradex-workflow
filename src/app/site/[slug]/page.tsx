import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteRenderer from "./site-renderer";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("site_data, company_name_en")
    .eq("subdomain", slug)
    .eq("status", "published")
    .single();

  if (!site?.site_data?.seo) {
    return { title: "TradeX Site" };
  }

  return {
    title: site.site_data.seo.title,
    description: site.site_data.seo.description,
    keywords: site.site_data.seo.keywords?.join(", "),
  };
}

export default async function SitePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("subdomain", slug)
    .eq("status", "published")
    .single();

  if (!site) {
    notFound();
  }

  // Increment visitor count (fire and forget)
  supabase
    .from("sites")
    .update({ visitors: (site.visitors || 0) + 1 })
    .eq("id", site.id)
    .then(() => {});

  return (
    <SiteRenderer
      siteData={site.site_data}
      companyName={site.company_name}
      companyNameEn={site.company_name_en}
      contactEmail={site.contact_email}
      contactWhatsapp={site.contact_whatsapp}
      siteId={site.id}
    />
  );
}
