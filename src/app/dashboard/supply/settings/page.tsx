"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings, Save, Loader2, Plus, Trash2, Truck, Bell,
  Shield, Package, DollarSign, Clock, Check,
} from "lucide-react";

interface SupplySettings {
  auto_confirm_orders: boolean; require_seller_approval: boolean;
  default_commission: number; return_window_days: number;
  auto_approve_returns: boolean; low_stock_notify: boolean;
  wecom_webhook_url: string;
}
interface ShippingZone { name: string; countries: string; method: { name: string; price: number; days: number } }
interface ShippingTemplate { id: string; name: string; is_default: boolean; zones: ShippingZone[] }

const DEFAULT_SETTINGS: SupplySettings = {
  auto_confirm_orders: false, require_seller_approval: true, default_commission: 5,
  return_window_days: 14, auto_approve_returns: false, low_stock_notify: true, wecom_webhook_url: "",
};

/* ---- Toggle Switch ---- */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? "bg-indigo-600" : "bg-gray-200"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function SupplySettingsPage() {
  const [settings, setSettings] = useState<SupplySettings>(DEFAULT_SETTINGS);
  const [templates, setTemplates] = useState<ShippingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: "", zoneName: "", countries: "", methodName: "标准快递", price: 0, days: 7 });

  const fetchTemplates = useCallback(() => {
    fetch("/api/supply/shipping-templates").then((r) => r.json()).then((json) => setTemplates(json.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/supply/settings").then((r) => r.json()),
      fetch("/api/supply/shipping-templates").then((r) => r.json()),
    ]).then(([s, t]) => {
      if (s && !s.error) setSettings({ ...DEFAULT_SETTINGS, ...s });
      setTemplates(t.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/supply/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleAddTemplate = async () => {
    if (!newTpl.name || !newTpl.zoneName) return;
    await fetch("/api/supply/shipping-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTpl.name,
        zones: [{ name: newTpl.zoneName, countries: newTpl.countries, method: { name: newTpl.methodName, price: newTpl.price, days: newTpl.days } }],
      }),
    });
    setNewTpl({ name: "", zoneName: "", countries: "", methodName: "标准快递", price: 0, days: 7 });
    setShowNewTemplate(false);
    fetchTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    await fetch(`/api/supply/shipping-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  const update = <K extends keyof SupplySettings>(key: K, value: SupplySettings[K]) => setSettings((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const toggleRows: { key: keyof SupplySettings; label: string; desc: string; icon: typeof Package }[] = [
    { key: "auto_confirm_orders", label: "自动确认订单", desc: "新订单自动确认，无需手动审核", icon: Check },
    { key: "require_seller_approval", label: "需要审核卖家", desc: "卖家订阅产品前需要供应商审核", icon: Shield },
    { key: "auto_approve_returns", label: "自动批准退货", desc: "在退货窗口期内自动批准退货请求", icon: Package },
    { key: "low_stock_notify", label: "库存预警通知", desc: "库存低于阈值时发送通知", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">供应商设置</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">管理供应链的基本配置、通知和运费模板</p>
      </div>

      {/* 基本设置 */}
      <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">基本设置</h3>
        <div className="space-y-5">
          {toggleRows.map(({ key, label, desc, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
              <Toggle checked={settings[key] as boolean} onChange={(v) => update(key, v as never)} />
            </div>
          ))}

          {/* Commission */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">默认佣金比例</p>
                <p className="text-xs text-gray-400">从每笔订单中收取的佣金百分比</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                value={settings.default_commission}
                onChange={(e) => update("default_commission", Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          {/* Return Window */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">退货窗口期</p>
                <p className="text-xs text-gray-400">买家可以申请退货的天数</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={settings.return_window_days}
                onChange={(e) => update("return_window_days", Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
              <span className="text-sm text-gray-500">天</span>
            </div>
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900">通知设置</h3>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">企微 Webhook URL</label>
          <input
            type="text"
            placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
            value={settings.wecom_webhook_url}
            onChange={(e) => update("wecom_webhook_url", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1.5 text-xs text-gray-400">配置后，订单和库存变动将推送到企业微信群</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          保存设置
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600 animate-in fade-in">
            <Check className="h-4 w-4" /> 已保存
          </span>
        )}
      </div>

      {/* 运费模板 */}
      <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">运费模板</h3>
          </div>
          <button
            onClick={() => setShowNewTemplate(!showNewTemplate)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" /> 新建模板
          </button>
        </div>

        {/* Template List */}
        {templates.length === 0 && !showNewTemplate ? (
          <p className="py-6 text-center text-sm text-gray-400">暂无运费模板，点击"新建模板"添加</p>
        ) : (
          <div className="space-y-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{tpl.name}</span>
                      {tpl.is_default && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">默认</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{tpl.zones?.length || 0} 个配送区域</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteTemplate(tpl.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New Template Form */}
        {showNewTemplate && (
          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">新建运费模板</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="模板名称"
                value={newTpl.name}
                onChange={(e) => setNewTpl({ ...newTpl, name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="区域名称（如：国内）"
                  value={newTpl.zoneName}
                  onChange={(e) => setNewTpl({ ...newTpl, zoneName: e.target.value })}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  type="text"
                  placeholder="国家/地区（如：CN, HK, TW）"
                  value={newTpl.countries}
                  onChange={(e) => setNewTpl({ ...newTpl, countries: e.target.value })}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="配送方式"
                  value={newTpl.methodName}
                  onChange={(e) => setNewTpl({ ...newTpl, methodName: e.target.value })}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    placeholder="运费"
                    value={newTpl.price || ""}
                    onChange={(e) => setNewTpl({ ...newTpl, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="text-xs text-gray-500">元</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    placeholder="时效"
                    value={newTpl.days || ""}
                    onChange={(e) => setNewTpl({ ...newTpl, days: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="text-xs text-gray-500">天</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  <Plus className="h-3.5 w-3.5" /> 添加
                </button>
                <button
                  onClick={() => setShowNewTemplate(false)}
                  className="rounded-lg px-4 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
