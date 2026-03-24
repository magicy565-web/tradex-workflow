"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Bell, Check, CheckCheck, Loader2, ShoppingCart,
  Package, Users, AlertTriangle, Clock, X,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  "subscription.new": { icon: Users, color: "text-blue-600 bg-blue-50" },
  "order.new":        { icon: ShoppingCart, color: "text-orange-600 bg-orange-50" },
  "order.confirmed":  { icon: Check, color: "text-emerald-600 bg-emerald-50" },
  "order.shipped":    { icon: Package, color: "text-purple-600 bg-purple-50" },
  "stock.low":        { icon: AlertTriangle, color: "text-red-600 bg-red-50" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    const params = new URLSearchParams({ limit: "50" });
    if (filter === "unread") params.set("unread", "true");
    const res = await fetch(`/api/supply/notifications?${params}`);
    const json = await res.json();
    setNotifications(json.data || []);
    setUnreadCount(json.unread_count || 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Supabase Realtime subscription for new notifications
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel("supply-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "supply_notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (ids: string[]) => {
    await fetch("/api/supply/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(prev - ids.length, 0));
  };

  const markAllRead = async () => {
    await fetch("/api/supply/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">通知中心</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount} 未读
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-l-lg px-3 py-1.5 text-xs font-medium ${filter === "all" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-r-lg px-3 py-1.5 text-xs font-medium ${filter === "unread" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              未读
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <CheckCheck className="h-3.5 w-3.5" /> 全部已读
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Bell className="mx-auto mb-2 h-8 w-8" />
          <p>{filter === "unread" ? "没有未读通知" : "暂无通知"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const typeConfig = TYPE_ICONS[n.type] || { icon: Bell, color: "text-gray-500 bg-gray-50" };
            const Icon = typeConfig.icon;
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markAsRead([n.id]); }}
                className={`group relative flex gap-3 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                  n.read
                    ? "border-black/[0.06] bg-white"
                    : "border-indigo-100 bg-indigo-50/30 cursor-pointer"
                }`}
              >
                {/* Unread dot */}
                {!n.read && (
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-indigo-500" />
                )}

                {/* Icon */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeConfig.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
                </div>

                {/* Mark as read */}
                {!n.read && (
                  <button
                    onClick={() => markAsRead([n.id])}
                    className="shrink-0 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                    title="标记已读"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
