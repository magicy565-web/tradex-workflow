/**
 * In-app notification center service.
 *
 * Creates notifications stored in supply_notifications table,
 * leveraging Supabase Realtime for instant delivery to the frontend.
 */

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface CreateNotificationParams {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Create an in-app notification for a user.
 * The notification will be delivered in real-time via Supabase Realtime subscriptions.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const admin = createAdminClient();

  await admin.from("supply_notifications").insert({
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data || {},
    read: false,
  });
}

/**
 * Notification templates for common supply chain events.
 */
export async function notifySupplierNewSubscription(
  supplierId: string,
  shopDomain: string,
  shopName: string | null,
  productTitle: string
): Promise<void> {
  await createNotification({
    user_id: supplierId,
    type: "subscription.new",
    title: "新卖家订阅",
    message: `${shopName || shopDomain} 订阅了你的商品「${productTitle}」`,
    data: { shop_domain: shopDomain, product_title: productTitle },
  });
}

export async function notifySupplierNewOrder(
  supplierId: string,
  orderNumber: string,
  shopDomain: string,
  productTitle: string,
  quantity: number,
  totalCost: number
): Promise<void> {
  await createNotification({
    user_id: supplierId,
    type: "order.new",
    title: "新的供应链订单",
    message: `来自 ${shopDomain} 的新订单 ${orderNumber}，${productTitle} x${quantity}，金额 $${totalCost.toFixed(2)}`,
    data: { order_number: orderNumber, shop_domain: shopDomain, product_title: productTitle, quantity, total_cost: totalCost },
  });
}

export async function notifySupplierStockLow(
  supplierId: string,
  productTitle: string,
  stockQuantity: number
): Promise<void> {
  await createNotification({
    user_id: supplierId,
    type: "stock.low",
    title: "库存预警",
    message: `产品「${productTitle}」库存不足，当前库存: ${stockQuantity}`,
    data: { product_title: productTitle, stock_quantity: stockQuantity },
  });
}
