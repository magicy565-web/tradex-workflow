export interface SiteProject {
  id: string;
  name: string;
  companyName: string;
  companyNameEn: string;
  industry: string;
  products: string[];
  targetMarkets: string[];
  buyerTypes: string[];
  sellingPoints: string[];
  contactEmail: string;
  contactWhatsapp: string;
  contactAddress: string;
  status: "draft" | "generating" | "preview" | "published";
  createdAt: string;
  publishedAt?: string;
  siteUrl?: string;
  subdomain?: string;
}

export interface BuildStep {
  id: number;
  title: string;
  titleZh: string;
  status: "pending" | "active" | "done" | "error";
  description: string;
}

export interface Inquiry {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  whatsapp: string;
  productType: string;
  clampingForce: string;
  application: string;
  quantity: string;
  port: string;
  message: string;
  status: "new" | "replied" | "quoted" | "closed";
  createdAt: string;
  siteId: string;
}
