import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">账户、团队与通知偏好</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Settings className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-400">设置页面开发中</p>
        <p className="text-sm text-gray-400 mt-1">账户管理、API 密钥配置即将上线</p>
      </div>
    </div>
  );
}
