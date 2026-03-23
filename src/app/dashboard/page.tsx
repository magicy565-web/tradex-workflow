import Link from "next/link";

const kpis = [
  { label: "在线站点", value: "2", color: "text-indigo-600" },
  { label: "本周询盘", value: "8", color: "text-emerald-600" },
  { label: "成交线索", value: "3", color: "text-amber-600" },
  { label: "剩余积分", value: "7,842", color: "text-violet-600" },
];

const quickActions = [
  {
    label: "新建站点",
    description: "AI 一键生成外贸独立站",
    href: "/dashboard/build",
    gradient: true,
  },
  {
    label: "查看询盘",
    description: "处理最新客户询盘",
    href: "/dashboard/inquiries",
    gradient: false,
  },
  {
    label: "生成内容",
    description: "AI 生成产品描述与文案",
    href: "/dashboard/content",
    gradient: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          欢迎回来，张明远
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          以下是您的业务概览
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-black/[0.06] bg-white p-6"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className={`mt-2 text-2xl font-bold ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          快速操作
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`group flex flex-col justify-between rounded-xl border p-6 transition-shadow hover:shadow-md ${
                action.gradient
                  ? "border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
                  : "border-black/[0.06] bg-white"
              }`}
            >
              <div>
                <p
                  className={`text-base font-semibold ${action.gradient ? "text-white" : "text-gray-900"}`}
                >
                  {action.label}
                </p>
                <p
                  className={`mt-1 text-sm ${action.gradient ? "text-white/80" : "text-gray-500"}`}
                >
                  {action.description}
                </p>
              </div>
              <span
                className={`mt-4 text-sm font-medium ${action.gradient ? "text-white/90" : "text-indigo-500"}`}
              >
                前往 &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
