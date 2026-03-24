import { createClient } from "@/lib/supabase/server";
import { sendSupplyNotification } from "@/lib/supply-notifications";
import { NextResponse } from "next/server";

// POST /api/supply/orders/batch - Batch operations on orders
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, order_ids, tracking_data } = body;

  if (!action || !order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
    return NextResponse.json(
      { error: "action and order_ids[] are required" },
      { status: 400 }
    );
  }

  if (order_ids.length > 50) {
    return NextResponse.json({ error: "Maximum 50 orders per batch" }, { status: 400 });
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  switch (action) {
    case "confirm": {
      // Batch confirm: pending → confirmed
      for (const id of order_ids) {
        const { data, error } = await supabase
          .from("supply_orders")
          .update({ status: "confirmed", updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("supplier_id", user.id)
          .eq("status", "pending")
          .select("id, order_number")
          .single();

        if (error || !data) {
          results.push({ id, success: false, error: error?.message || "Not found or wrong status" });
        } else {
          results.push({ id, success: true });
        }
      }
      break;
    }

    case "fulfill": {
      // Batch fulfill with same tracking info
      if (!tracking_data?.tracking_number) {
        return NextResponse.json(
          { error: "tracking_data.tracking_number is required for batch fulfill" },
          { status: 400 }
        );
      }

      for (const id of order_ids) {
        const { data, error } = await supabase
          .from("supply_orders")
          .update({
            status: "shipped",
            tracking_company: tracking_data.tracking_company || null,
            tracking_number: tracking_data.tracking_number,
            tracking_url: tracking_data.tracking_url || null,
            shipped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("supplier_id", user.id)
          .in("status", ["confirmed", "processing"])
          .select("id, order_number")
          .single();

        if (error || !data) {
          results.push({ id, success: false, error: error?.message || "Not found or wrong status" });
        } else {
          results.push({ id, success: true });
          // Fire-and-forget notification
          sendSupplyNotification("order.shipped", {
            order_number: data.order_number,
            tracking_company: tracking_data.tracking_company,
            tracking_number: tracking_data.tracking_number,
          }).catch(() => {});
        }
      }
      break;
    }

    case "cancel": {
      // Batch cancel: pending/confirmed → cancelled
      for (const id of order_ids) {
        const { data, error } = await supabase
          .from("supply_orders")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("supplier_id", user.id)
          .in("status", ["pending", "confirmed"])
          .select("id, order_number")
          .single();

        if (error || !data) {
          results.push({ id, success: false, error: error?.message || "Not found or wrong status" });
        } else {
          results.push({ id, success: true });
        }
      }
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid action. Use: confirm, fulfill, cancel" }, { status: 400 });
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    action,
    total: order_ids.length,
    success: successCount,
    failed: failCount,
    results,
  });
}
