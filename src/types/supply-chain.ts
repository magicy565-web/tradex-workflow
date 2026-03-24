// Supply Chain Types

export interface SupplyProduct {
  id: string;
  user_id: string;
  site_id?: string;
  title: string;
  title_zh?: string;
  description?: string;
  category?: string;
  images: string[];
  sku?: string;
  supply_price: number;
  msrp?: number;
  currency: string;
  moq: number;
  lead_time_days: number;
  stock_quantity: number;
  specs: Array<{ label: string; value: string }>;
  variants: Array<{ name: string; options: string[]; prices: number[] }>;
  weight_kg?: number;
  dimensions?: { length: number; width: number; height: number; unit: string };
  origin_country: string;
  hs_code?: string;
  status: "draft" | "active" | "paused" | "archived";
  subscribers_count: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface ShopifySeller {
  id: string;
  shop_domain: string;
  shop_name?: string;
  email?: string;
  api_key: string;
  api_secret: string;
  access_token?: string;
  app_installed: boolean;
  plan: "free" | "pro";
  products_synced: number;
  total_orders: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SupplySubscription {
  id: string;
  seller_id: string;
  product_id: string;
  supplier_id: string;
  shopify_product_id?: number;
  markup_type: "percentage" | "fixed";
  markup_value: number;
  auto_sync: boolean;
  status: "active" | "paused" | "removed";
  created_at: string;
  // Joined fields
  seller?: ShopifySeller;
  product?: SupplyProduct;
}

export interface SupplyOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  seller_id: string;
  product_id: string;
  subscription_id?: string;
  shopify_order_id?: number;
  shopify_order_name?: string;
  quantity: number;
  variant_info?: Record<string, string>;
  unit_cost: number;
  total_cost: number;
  seller_price?: number;
  commission: number;
  shipping_address: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  };
  tracking_company?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  seller?: ShopifySeller;
  product?: SupplyProduct;
}

export interface SupplyStats {
  total_products: number;
  active_products: number;
  total_subscribers: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
}

// Valid order status transitions
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
