"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserProvider, useUser } from "@/lib/user-context";
import {
  LayoutDashboard,
  Wand2,
  Globe,
  MessageSquare,
  TrendingUp,
  PenTool,
  Smartphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2,
  Workflow,
  Package,
  ShoppingCart,
} from "lucide-react";

const navSections = [
  {
    label: "工作台",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "工作台" },
      {
        href: "/dashboard/build",
        icon: Wand2,
        label: "建站助手",
        dot: "green",
      },
      { href: "/dashboard/sites", icon: Globe, label: "我的站点" },
    ],
  },
  {
    label: "获客",
    items: [
      {
        href: "/dashboard/inquiries",
        icon: MessageSquare,
        label: "询盘中心",
        badge: "3",
      },
      { href: "/dashboard/leads", icon: TrendingUp, label: "线索管理" },
    ],
  },
  {
    label: "工具",
    items: [
      { href: "/dashboard/workflow", icon: Workflow, label: "工作流", dot: "green" },
      { href: "/dashboard/content", icon: PenTool, label: "内容生成" },
      { href: "/dashboard/wecom", icon: Smartphone, label: "企微集成" },
    ],
  },
  {
    label: "供应链",
    items: [
      { href: "/dashboard/supply", icon: Package, label: "供应链概览", dot: "green" },
      { href: "/dashboard/supply/products", icon: Package, label: "产品管理" },
      { href: "/dashboard/supply/orders", icon: ShoppingCart, label: "订单管理" },
    ],
  },
  {
    label: "设置",
    items: [
      { href: "/dashboard/settings", icon: Settings, label: "系统设置" },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "工作台",
  "/dashboard/build": "建站助手",
  "/dashboard/sites": "我的站点",
  "/dashboard/inquiries": "询盘中心",
  "/dashboard/leads": "线索管理",
  "/dashboard/content": "内容生成",
  "/dashboard/workflow": "工作流",
  "/dashboard/wecom": "企微集成",
  "/dashboard/supply": "供应链概览",
  "/dashboard/supply/products": "供应链产品",
  "/dashboard/supply/orders": "供应链订单",
  "/dashboard/settings": "系统设置",
};

const planLabels: Record<string, string> = {
  trial: "试用版",
  pro: "Pro 专业版",
  enterprise: "企业版",
};

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useUser();

  const sidebarWidth = collapsed ? "w-16" : "w-60";
  const pageTitle = pageTitles[pathname] ?? "工作台";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "用户";
  const nameInitial = displayName.charAt(0).toUpperCase();
  const credits = profile?.credits ?? 0;
  const plan = profile?.plan ?? "trial";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/60">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/60">
      {/* Sidebar */}
      <aside
        className={`${sidebarWidth} fixed inset-y-0 left-0 z-30 flex flex-col border-r border-black/[0.06] bg-[#f5f5fa] transition-all duration-200`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
            T
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-gray-900">
              TradeX
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "border border-black/[0.06] bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-500" />
                        )}
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {"dot" in item && item.dot === "green" && (
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            )}
                            {"badge" in item && item.badge && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-3 mb-2 flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* User Footer */}
        <div className="border-t border-black/[0.06] px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 text-xs font-bold text-white">
              {nameInitial}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {displayName}
                </p>
                <p className="text-[11px] text-indigo-500">
                  {planLabels[plan] || plan}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={signOut}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 transition-colors"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${collapsed ? "ml-16" : "ml-60"}`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-black/[0.06] bg-white/80 px-6 backdrop-blur">
          <h1 className="text-base font-semibold text-gray-900">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-black/[0.06] px-3 py-1 text-xs font-medium text-gray-600">
              {credits.toLocaleString()} 积分
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
