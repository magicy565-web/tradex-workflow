import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/geo/inquiries/export — Export inquiries as CSV
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";

  let query = supabase
    .from("geo_inquiries")
    .select("*, page:geo_pages(title, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data || [];

  // Build CSV
  const headers = [
    "日期",
    "联系人",
    "邮箱",
    "公司",
    "国家",
    "询盘类型",
    "预估数量",
    "来源",
    "状态",
    "留言",
    "来源页面",
  ];

  const csvRows = [headers.join(",")];

  for (const row of rows) {
    const page = row.page as { title?: string } | null;
    csvRows.push(
      [
        new Date(row.created_at).toISOString().split("T")[0],
        escapeCsv(row.contact_name),
        escapeCsv(row.email),
        escapeCsv(row.company_name || ""),
        escapeCsv(row.country || ""),
        escapeCsv(row.inquiry_type || ""),
        escapeCsv(row.quantity_estimate || ""),
        escapeCsv(row.source || ""),
        escapeCsv(row.status || ""),
        escapeCsv(row.message || ""),
        escapeCsv(page?.title || ""),
      ].join(",")
    );
  }

  const csv = "\uFEFF" + csvRows.join("\n"); // BOM for Excel compatibility

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="geo-inquiries-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (!value) return '""';
  const escaped = value.replace(/"/g, '""').replace(/\n/g, " ");
  return `"${escaped}"`;
}
