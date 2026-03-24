/**
 * Supply Chain Notification Service
 *
 * Sends notifications for supply chain events via:
 * - WeChat Work (企微) webhook
 * - Email (future)
 *
 * Reuses the existing notification infrastructure.
 */

interface NotificationPayload {
  event: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// WeChat Work webhook notification
async function sendWeComNotification(webhookUrl: string, payload: NotificationPayload) {
  try {
    const content = `**${payload.title}**\n${payload.message}`;
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: { content },
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("[Notification] WeCom send failed:", error);
    return false;
  }
}

// Notification templates
const TEMPLATES: Record<string, (data: Record<string, unknown>) => NotificationPayload> = {
  "subscription.new": (data) => ({
    event: "subscription.new",
    title: "新卖家订阅",
    message: [
      `**${data.seller_name || data.shop_domain}** 订阅了你的商品「${data.product_title}」`,
      `店铺: ${data.shop_domain}`,
      `时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
      "",
      "[点击查看详情](/dashboard/supply/products)",
    ].join("\n"),
  }),

  "order.new": (data) => ({
    event: "order.new",
    title: "新的供应链订单",
    message: [
      `来自 **${data.seller_name || data.shop_domain}** 的新订单`,
      `产品: ${data.product_title}`,
      `数量: ${data.quantity}`,
      `订单号: ${data.order_number}`,
      `金额: $${data.total_cost}`,
      "",
      "请尽快确认并安排发货",
      "[点击处理订单](/dashboard/supply/orders?status=pending)",
    ].join("\n"),
  }),

  "order.confirmed": (data) => ({
    event: "order.confirmed",
    title: "订单已确认",
    message: [
      `供应商已确认订单 **${data.order_number}**`,
      `预计 ${data.lead_time_days || 7} 天内发货`,
    ].join("\n"),
  }),

  "order.shipped": (data) => ({
    event: "order.shipped",
    title: "订单已发货",
    message: [
      `订单 **${data.order_number}** 已发货`,
      `物流公司: ${data.tracking_company || "—"}`,
      `物流单号: ${data.tracking_number}`,
      data.tracking_url ? `[追踪链接](${data.tracking_url})` : "",
    ].join("\n"),
  }),

  "stock.low": (data) => ({
    event: "stock.low",
    title: "库存预警",
    message: [
      `产品「${data.product_title}」库存不足`,
      `当前库存: ${data.stock_quantity}`,
      `建议及时补货`,
    ].join("\n"),
  }),
};

/**
 * Send a supply chain notification.
 *
 * @param event - The event type (e.g., "subscription.new", "order.new")
 * @param data - Event-specific data for the notification template
 * @param webhookUrl - Optional WeCom webhook URL (falls back to env)
 */
export async function sendSupplyNotification(
  event: string,
  data: Record<string, unknown>,
  webhookUrl?: string
): Promise<boolean> {
  const template = TEMPLATES[event];
  if (!template) {
    console.warn(`[Notification] Unknown event type: ${event}`);
    return false;
  }

  const payload = template(data);
  const url = webhookUrl || process.env.WECOM_WEBHOOK_URL;

  if (!url) {
    console.warn("[Notification] No webhook URL configured, skipping notification");
    // In development, log the notification
    console.log("[Notification]", JSON.stringify(payload, null, 2));
    return false;
  }

  return sendWeComNotification(url, payload);
}
