// Node category and type definitions for the workflow editor

export interface NodeTypeConfig {
  type: string;
  label: string;
  category: "trigger" | "action" | "condition" | "output";
  icon: string; // emoji
  color: string; // tailwind bg class
  borderColor: string;
  description: string;
  inputs: number;
  outputs: number;
}

export const NODE_CATEGORIES = [
  { key: "trigger" as const, label: "触发器", color: "text-orange-600" },
  { key: "action" as const, label: "动作", color: "text-blue-600" },
  { key: "condition" as const, label: "条件", color: "text-violet-600" },
  { key: "output" as const, label: "输出", color: "text-emerald-600" },
];

export const NODE_TYPES: NodeTypeConfig[] = [
  // Triggers
  {
    type: "trigger_inquiry",
    label: "新询盘",
    category: "trigger",
    icon: "📩",
    color: "bg-orange-50",
    borderColor: "border-orange-300",
    description: "当收到新询盘时触发",
    inputs: 0,
    outputs: 1,
  },
  {
    type: "trigger_visitor",
    label: "网站访客",
    category: "trigger",
    icon: "👁",
    color: "bg-orange-50",
    borderColor: "border-orange-300",
    description: "当新访客访问站点时触发",
    inputs: 0,
    outputs: 1,
  },
  {
    type: "trigger_schedule",
    label: "定时触发",
    category: "trigger",
    icon: "⏰",
    color: "bg-orange-50",
    borderColor: "border-orange-300",
    description: "按设定时间周期触发",
    inputs: 0,
    outputs: 1,
  },

  // Actions
  {
    type: "action_ai_reply",
    label: "AI 智能回复",
    category: "action",
    icon: "🤖",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    description: "使用 AI 自动生成回复内容",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "action_send_email",
    label: "发送邮件",
    category: "action",
    icon: "✉️",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    description: "向客户发送邮件",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "action_wecom",
    label: "企微通知",
    category: "action",
    icon: "💬",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    description: "发送企业微信通知",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "action_score_lead",
    label: "线索评分",
    category: "action",
    icon: "⭐",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    description: "AI 自动评估线索质量",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "action_translate",
    label: "AI 翻译",
    category: "action",
    icon: "🌐",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    description: "自动翻译询盘内容",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "action_delay",
    label: "延时等待",
    category: "action",
    icon: "⏳",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    description: "等待指定时间后继续",
    inputs: 1,
    outputs: 1,
  },

  // Conditions
  {
    type: "condition_amount",
    label: "询盘金额",
    category: "condition",
    icon: "💰",
    color: "bg-violet-50",
    borderColor: "border-violet-300",
    description: "根据询盘金额大小分流",
    inputs: 1,
    outputs: 2,
  },
  {
    type: "condition_country",
    label: "客户国家",
    category: "condition",
    icon: "🌍",
    color: "bg-violet-50",
    borderColor: "border-violet-300",
    description: "根据客户所在国家分流",
    inputs: 1,
    outputs: 2,
  },
  {
    type: "condition_product",
    label: "产品类型",
    category: "condition",
    icon: "🏭",
    color: "bg-violet-50",
    borderColor: "border-violet-300",
    description: "根据产品类型分流",
    inputs: 1,
    outputs: 2,
  },

  // Outputs
  {
    type: "output_crm",
    label: "保存到 CRM",
    category: "output",
    icon: "💾",
    color: "bg-emerald-50",
    borderColor: "border-emerald-300",
    description: "将数据保存到 CRM 系统",
    inputs: 1,
    outputs: 0,
  },
  {
    type: "output_status",
    label: "更新状态",
    category: "output",
    icon: "🏷",
    color: "bg-emerald-50",
    borderColor: "border-emerald-300",
    description: "更新询盘或线索状态",
    inputs: 1,
    outputs: 0,
  },
  {
    type: "output_webhook",
    label: "Webhook",
    category: "output",
    icon: "🔗",
    color: "bg-emerald-50",
    borderColor: "border-emerald-300",
    description: "调用外部 Webhook 接口",
    inputs: 1,
    outputs: 0,
  },
];

export function getNodeConfig(type: string): NodeTypeConfig | undefined {
  return NODE_TYPES.find((n) => n.type === type);
}
