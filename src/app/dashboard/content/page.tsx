import { PenTool } from "lucide-react";

export default function ContentPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          内容生成
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          AIGC 多平台内容自动生成
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-black/[0.06] bg-white px-6 py-24 text-center">
        <PenTool className="h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-base font-semibold text-gray-900">
          内容生成模块开发中
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          产品描述、视频脚本、社媒帖子生成即将上线
        </p>
      </div>
    </div>
  );
}
