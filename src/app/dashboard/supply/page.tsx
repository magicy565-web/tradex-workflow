"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowRight,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface Stats {
  total_products: number;
  active_products: number;
  total_subscribers: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
}

export default function SupplyDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/supply/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          label: "上架产品",
          value: stats.active_products,
          sub: `${stats.total_products} 总计`,
          icon: Package,
          color: "text-blue-600 bg-blue-50",
          href: "/dashboard/supply/products",
        },
        {
          label: "卖家订阅",
          value: stats.total_subscribers,
          sub: "活跃订阅",
          icon: Users,
          color: "text-emerald-600 bg-emerald-50",
          href: "/dashboard/supply/products",
        },
        {
          label: "供应链订单",
          value: stats.total_orders,
          sub: `${stats.pending_orders} 待处理`,
          icon: ShoppingCart,
          color: "text-orange-600 bg-orange-50",
          href: "/dashboard/supply/orders",
        },
        {
          label: "总收入",
          value: `$${stats.total_revenue.toLocaleString()}`,
          sub: "USD",
          icon: DollarSign,
          color: "text-violet-600 bg-violet-50",
          href: "/dashboard/supply/orders",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">供应链概览</h2>
          <p className="mt-1 text-sm text-gray-500">
            管理你的供应链产品、订阅和订单
          </p>
        </div>
        <Link
          href="/dashboard/supply/products"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Package className="h-4 w-4" />
          管理产品
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-black/[0.06] bg-white"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" />
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pending Orders Alert */}
        {stats && stats.pending_orders > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">
                {stats.pending_orders} 个订单待处理
              </h3>
            </div>
            <p className="mt-2 text-sm text-orange-700">
              你有新的供应链订单需要确认和处理，请尽快查看。
            </p>
            <Link
              href="/dashboard/supply/orders?status=pending"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900"
            >
              查看待处理订单 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Quick Links */}
        <div className="rounded-xl border border-black/[0.06] bg-white p-5">
          <h3 className="font-semibold text-gray-900">快捷操作</h3>
          <div className="mt-3 space-y-2">
            <Link
              href="/dashboard/supply/products?action=new"
              className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Package className="h-4 w-4 text-blue-500" />
              上架新产品到供应链
            </Link>
            <Link
              href="/dashboard/supply/orders"
              className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Clock className="h-4 w-4 text-orange-500" />
              查看所有订单
            </Link>
            <Link
              href="/dashboard/supply/products"
              className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              查看产品订阅数据
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
