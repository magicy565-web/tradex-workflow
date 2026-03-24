import { verifyHmacAuth } from "@/lib/hmac-auth";
import { NextResponse } from "next/server";

// DELETE /api/supply/subscriptions/[id] - Cancel a subscription
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyHmacAuth(request);
  if (!auth.success) return auth.response;

  const { seller, adminClient } = auth;

  const { data, error } = await adminClient
    .from("supply_subscriptions")
    .update({ status: "removed" })
    .eq("id", id)
    .eq("seller_id", seller.id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Subscription cancelled", data });
}
