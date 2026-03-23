import { Smartphone } from "lucide-react";

export default function WecomPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          企微集成
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          企业微信通知推送与经营触发
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-black/[0.06] bg-white px-6 py-24 text-center">
        <Smartphone className="h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-base font-semibold text-gray-900">
          企微集成模块开发中
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          站点通知、询盘提醒、经营日报推送即将上线
        </p>
      </div>
    </div>
  );
}
