import { createClient } from "@/lib/supabase/server";
import { pushWebhookEvent } from "@/lib/webhook-delivery";
import { NextResponse } from "next/server";

// PUT /api/supply/returns/[id]/approve - Approve a return request
export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify return exists and belongs to supplier
  const { data: returnRecord, error: fetchError } = await supabase
    .from("supply_returns")
    .select("id, status, seller_id, return_number")
    .eq("id", id)
    .eq("supplier_id", user.id)
    .single();

  if (fetchError || !returnRecord) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }

  if (returnRecord.status !== "requested") {
    return NextResponse.json(
      { error: `Cannot approve return in ${returnRecord.status} status` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("supply_returns")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("supplier_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Push webhook to seller's Shopify App
  pushWebhookEvent({
    event: "return.approved",
    data: { return_id: data.id, return_number: data.return_number },
    seller_id: returnRecord.seller_id,
  }).catch(() => {});

  return NextResponse.json(data);
}
