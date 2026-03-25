import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PUT /api/supply/sellers/[id]/approve - Approve or suspend a seller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.action || !["approve", "suspend"].includes(body.action)) {
    return NextResponse.json(
      { error: "action must be 'approve' or 'suspend'" },
      { status: 400 }
    );
  }

  // Validate the seller exists and has subscriptions to this supplier's products
  const { data: subscription, error: subError } = await supabase
    .from("supply_subscriptions")
    .select("id")
    .eq("supplier_id", user.id)
    .eq("seller_id", id)
    .limit(1)
    .maybeSingle();

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!subscription) {
    return NextResponse.json(
      { error: "Seller not found or has no subscriptions to your products" },
      { status: 404 }
    );
  }

  // Build update payload based on action
  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.action === "approve") {
    updateFields.approval_status = "approved";
    updateFields.approved_at = new Date().toISOString();
    if (body.tier !== undefined) {
      updateFields.tier = body.tier;
    }
    if (body.commission_rate !== undefined) {
      updateFields.commission_rate = body.commission_rate;
    }
  } else {
    updateFields.approval_status = "suspended";
    updateFields.suspended_at = new Date().toISOString();
    if (body.suspend_reason) {
      updateFields.suspend_reason = body.suspend_reason;
    }
  }

  const { data, error } = await supabase
    .from("shopify_sellers")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
