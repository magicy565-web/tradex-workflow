"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package, Plus, Search, Edit3, Trash2, Eye, EyeOff,
  ChevronDown, X, Loader2, DollarSign, Users, ShoppingCart, Upload,
} from "lucide-react";
import type { SupplyProduct } from "@/types/supply-chain";

/* placeholder for form fields */
type ProductFormData = Partial<SupplyProduct> & { title: string; supply_price: number };

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:    { label: "草稿",   color: "bg-gray-100 text-gray-700" },
  active:   { label: "已上架", color: "bg-emerald-50 text-emerald-700" },
  paused:   { label: "已暂停", color: "bg-yellow-50 text-yellow-700" },
  archived: { label: "已下架", color: "bg-red-50 text-red-600" },
};

const CATEGORIES = [
  "Injection Molding Machine",
  "Hydraulic Press",
  "Blow Molding Machine",
  "Extrusion Machine",
  "Spare Parts",
  "Molds",
  "Other",
];

export default function SupplyProductsPage() {
  /* -- state -- */
  const [products, setProducts] = useState<SupplyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplyProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  /* -- fetch -- */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/supply/products?${params}`);
    const json = await res.json();
    setProducts(json.data || []);
    setTotal(json.pagination?.total || 0);
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* -- form -- */
  const emptyForm: ProductFormData = {
    title: "", title_zh: "", description: "", category: "",
    supply_price: 0, msrp: 0, moq: 1, lead_time_days: 7,
    stock_quantity: 0, sku: "", origin_country: "CN", status: "draft",
  };
  const [form, setForm] = useState<ProductFormData>(emptyForm);

  const openNew = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: SupplyProduct) => {
    setEditingProduct(p);
    setForm({
      title: p.title, title_zh: p.title_zh || "", description: p.description || "",
      category: p.category || "", supply_price: p.supply_price, msrp: p.msrp || 0,
      moq: p.moq, lead_time_days: p.lead_time_days, stock_quantity: p.stock_quantity,
      sku: p.sku || "", origin_country: p.origin_country, status: p.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.supply_price) return;
    setSaving(true);

    const url = editingProduct
      ? `/api/supply/products/${editingProduct.id}`
      : "/api/supply/products";
    const method = editingProduct ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowForm(false);
      fetchProducts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要下架此产品吗？")) return;
    await fetch(`/api/supply/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/supply/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "Injection Molding Machine" }),
      });
      const json = await res.json();
      setImportResult(json);
      if (json.imported > 0) fetchProducts();
    } catch {
      setImportResult({ imported: 0, skipped: 0, errors: ["Import request failed"] });
    }
    setImporting(false);
  };

  const toggleStatus = async (p: SupplyProduct) => {
    const newStatus = p.status === "active" ? "paused" : "active";
    await fetch(`/api/supply/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchProducts();
  };

  /* -- filtered display -- */
  const filtered = search
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          (p.title_zh && p.title_zh.includes(search)) ||
          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
      )
    : products;

  const totalPages = Math.ceil(total / 20);

  /* -- render -- */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">供应链产品</h2>
          <p className="text-sm text-gray-500">管理你的供应链产品目录</p>
        </div>
        <button
          onClick={() => { setShowImport(true); setImportResult(null); }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Upload className="h-4 w-4" /> 导入产品
        </button>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> 上架新产品
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索产品名称或 SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-indigo-300"
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="active">已上架</option>
            <option value="paused">已暂停</option>
            <option value="archived">已下架</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">产品</th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-500 md:table-cell">分类</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">供货价</th>
              <th className="hidden px-4 py-3 text-center font-medium text-gray-500 sm:table-cell">库存</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">状态</th>
              <th className="hidden px-4 py-3 text-center font-medium text-gray-500 lg:table-cell">订阅</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400">
                  <Package className="mx-auto mb-2 h-8 w-8" />
                  暂无产品，点击"上架新产品"开始
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const st = STATUS_MAP[p.status] || STATUS_MAP.draft;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{p.title}</p>
                          {p.title_zh && (
                            <p className="truncate text-xs text-gray-400">{p.title_zh}</p>
                          )}
                          {p.sku && (
                            <p className="text-[11px] text-gray-400">SKU: {p.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                      {p.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900">
                      ${Number(p.supply_price).toFixed(2)}
                    </td>
                    <td className="hidden px-4 py-3 text-center sm:table-cell">
                      <span className={p.stock_quantity < 10 ? "text-red-600 font-medium" : "text-gray-600"}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-center lg:table-cell">
                      <div className="flex items-center justify-center gap-1 text-gray-500">
                        <Users className="h-3.5 w-3.5" /> {p.subscribers_count}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="编辑"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(p)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title={p.status === "active" ? "暂停" : "上架"}
                        >
                          {p.status === "active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title="下架"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              共 {total} 个产品，第 {page}/{totalPages} 页
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-md border border-gray-200 px-3 py-1 text-xs disabled:opacity-40"
              >
                上一页
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-md border border-gray-200 px-3 py-1 text-xs disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? "编辑产品" : "上架新产品"}
              </h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Form Body */}
            <div className="space-y-4 p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    英文产品名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="e.g. Servo Hydraulic Injection Molding Machine"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">中文产品名</label>
                  <input
                    type="text"
                    value={form.title_zh || ""}
                    onChange={(e) => setForm({ ...form, title_zh: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="例：伺服液压注塑机"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">产品描述</label>
                <textarea
                  rows={3}
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  placeholder="产品详细描述..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">产品分类</label>
                  <select
                    value={form.category || ""}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
                  >
                    <option value="">选择分类</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">SKU</label>
                  <input
                    type="text"
                    value={form.sku || ""}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">原产国</label>
                  <input
                    type="text"
                    value={form.origin_country || "CN"}
                    onChange={(e) => setForm({ ...form, origin_country: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">定价与库存</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      供货价 (USD) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={form.supply_price || ""}
                        onChange={(e) => setForm({ ...form, supply_price: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">建议零售价</label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={form.msrp || ""}
                        onChange={(e) => setForm({ ...form, msrp: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">最小起订量</label>
                    <input
                      type="number"
                      value={form.moq || 1}
                      onChange={(e) => setForm({ ...form, moq: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">库存数量</label>
                    <input
                      type="number"
                      value={form.stock_quantity || 0}
                      onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">发货设置</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">发货时效（天）</label>
                    <input
                      type="number"
                      value={form.lead_time_days || 7}
                      onChange={(e) => setForm({ ...form, lead_time_days: parseInt(e.target.value) || 7 })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">状态</label>
                    <select
                      value={form.status || "draft"}
                      onChange={(e) => setForm({ ...form, status: e.target.value as SupplyProduct["status"] })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
                    >
                      <option value="draft">草稿</option>
                      <option value="active">上架（可被卖家浏览）</option>
                      <option value="paused">暂停</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.supply_price}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProduct ? "保存修改" : "上架产品"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">从站点导入产品</h3>
              <button onClick={() => setShowImport(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              从你已有的 TradeX 站点中导入产品到供应链目录。系统将自动跳过已存在的产品。
            </p>
            {importResult ? (
              <div className="space-y-2">
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  成功导入 {importResult.imported} 个产品
                  {importResult.skipped > 0 && `，跳过 ${importResult.skipped} 个`}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                )}
                <div className="flex justify-end">
                  <button onClick={() => setShowImport(false)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    完成
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowImport(false)} className="rounded-lg border px-4 py-2 text-sm">取消</button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                  开始导入
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
