import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";

const sites = [
  {
    name: "宁波精机注塑 B2B 站",
    url: "ningbo-jinji.tradex.com",
    status: "已上线",
    statusColor: "bg-emerald-50 text-emerald-700",
    stats: { visitors: "324", inquiries: "8", conversion: "2.5%" },
    ready: true,
  },
  {
    name: "浙江华塑机械官网",
    url: "zj-huasu.tradex.com",
    status: "生成中",
    statusColor: "bg-amber-50 text-amber-700",
    stats: null,
    ready: false,
  },
];

export default function SitesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          我的站点
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          管理和编辑你的外贸站点
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div
            key={site.name}
            className="flex flex-col justify-between rounded-xl border border-black/[0.06] bg-white p-6"
          >
            <div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${site.statusColor}`}
              >
                {site.status}
              </span>
              <h3 className="mt-3 text-base font-semibold text-gray-900">
                {site.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <ExternalLink className="h-3.5 w-3.5" />
                {site.url}
              </p>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              {site.stats ? (
                <p className="text-sm text-gray-500">
                  访客{" "}
                  <span className="font-medium text-gray-900">
                    {site.stats.visitors}
                  </span>
                  {" | "}询盘{" "}
                  <span className="font-medium text-gray-900">
                    {site.stats.inquiries}
                  </span>
                  {" | "}转化率{" "}
                  <span className="font-medium text-gray-900">
                    {site.stats.conversion}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-400">&mdash;</p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {site.ready ? (
                <>
                  <button className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
                    编辑站点
                  </button>
                  <button className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                    查看
                  </button>
                </>
              ) : (
                <button className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  查看进度
                </button>
              )}
            </div>
          </div>
        ))}

        {/* New site card */}
        <Link
          href="/dashboard/build"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-6 text-gray-400 transition hover:border-indigo-300 hover:text-indigo-500"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm font-medium">+ 新建站点</span>
        </Link>
      </div>
    </div>
  );
}
