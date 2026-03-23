import { TrendingUp } from "lucide-react";

export default function LeadsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          线索管理
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          智能线索推送与成交预测
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-black/[0.06] bg-white px-6 py-24 text-center">
        <TrendingUp className="h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-base font-semibold text-gray-900">
          线索管理模块开发中
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          每日线索推送、评分与跟进功能即将上线
        </p>
      </div>
    </div>
  );
}
