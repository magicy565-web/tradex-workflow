// Node category and type definitions for the site-builder workflow editor

export interface NodeField {
  key: string;
  label: string;
  type: "text" | "textarea" | "tags" | "products";
  placeholder?: string;
  defaultValue?: string | string[];
}

export interface NodeTypeConfig {
  type: string;
  label: string;
  category: "input" | "ai" | "compose" | "output";
  icon: string;
  color: string; // tailwind bg class for node background
  borderColor: string; // tailwind border class
  accentColor: string; // hex color for minimap and edges
  description: string;
  inputs: number; // number of input handles
  outputs: number; // number of output handles
  fields?: NodeField[]; // configurable fields (only for input nodes)
}

export const NODE_CATEGORIES = [
  { key: "input" as const, label: "输入", color: "text-orange-600" },
  { key: "ai" as const, label: "AI 生成", color: "text-blue-600" },
  { key: "compose" as const, label: "组装", color: "text-violet-600" },
  { key: "output" as const, label: "输出", color: "text-emerald-600" },
];

export const NODE_TYPES: NodeTypeConfig[] = [
  // ── Input 输入 ──────────────────────────────────────────────────────
  {
    type: "input_company",
    label: "公司信息",
    category: "input",
    icon: "🏢",
    color: "bg-orange-50",
    borderColor: "border-orange-300",
    accentColor: "#f97316",
    description: "输入公司名称与基本信息",
    inputs: 0,
    outputs: 1,
    fields: [
      {
        key: "companyName",
        label: "公司名称",
        type: "text",
        placeholder: "例：宁波精密注塑机械有限公司",
      },
      {
        key: "companyNameEn",
        label: "英文名称",
        type: "text",
        placeholder: "e.g. Ningbo Precision Injection Machinery Co., Ltd.",
      },
      {
        key: "sellingPoints",
        label: "核心卖点",
        type: "textarea",
        placeholder: "每行一条，例：\n20 年出口经验\nCE / ISO 认证\n全球 3000+ 客户",
      },
    ],
  },
  {
    type: "input_products",
    label: "产品数据",
    category: "input",
    icon: "📦",
    color: "bg-orange-50",
    borderColor: "border-orange-300",
    accentColor: "#f97316",
    description: "定义产品列表与规格参数",
    inputs: 0,
    outputs: 1,
    fields: [
      {
        key: "products",
        label: "产品列表",
        type: "products",
        placeholder: "添加产品及其规格参数",
      },
    ],
  },
  {
    type: "input_markets",
    label: "目标市场",
    category: "input",
    icon: "🌍",
    color: "bg-orange-50",
    borderColor: "border-orange-300",
    accentColor: "#f97316",
    description: "选择目标出口市场",
    inputs: 0,
    outputs: 1,
    fields: [
      {
        key: "markets",
        label: "目标市场",
        type: "tags",
        placeholder: "输入市场名称后回车，例：Southeast Asia",
        defaultValue: ["Southeast Asia", "South America", "Middle East"],
      },
    ],
  },
  {
    type: "input_contact",
    label: "联系方式",
    category: "input",
    icon: "📞",
    color: "bg-orange-50",
    borderColor: "border-orange-300",
    accentColor: "#f97316",
    description: "设置联系邮箱与 WhatsApp",
    inputs: 0,
    outputs: 1,
    fields: [
      {
        key: "email",
        label: "联系邮箱",
        type: "text",
        placeholder: "sales@example.com",
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        type: "text",
        placeholder: "+86 138 0000 0000",
      },
    ],
  },

  // ── AI 生成 ─────────────────────────────────────────────────────────
  {
    type: "ai_hero",
    label: "AI Hero 文案",
    category: "ai",
    icon: "✨",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    accentColor: "#3b82f6",
    description: "AI 生成首屏标语与主标题",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "ai_products",
    label: "AI 产品描述",
    category: "ai",
    icon: "🤖",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    accentColor: "#3b82f6",
    description: "AI 生成产品描述与技术规格",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "ai_about",
    label: "AI 公司介绍",
    category: "ai",
    icon: "📝",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    accentColor: "#3b82f6",
    description: "AI 生成公司简介与认证信息",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "ai_faq",
    label: "AI FAQ 生成",
    category: "ai",
    icon: "❓",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    accentColor: "#3b82f6",
    description: "AI 生成常见问题与解答",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "ai_seo",
    label: "AI SEO 优化",
    category: "ai",
    icon: "🔍",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    accentColor: "#3b82f6",
    description: "AI 生成 SEO 标题、描述与关键词",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "ai_why_us",
    label: "AI 优势提炼",
    category: "ai",
    icon: "🏆",
    color: "bg-blue-50",
    borderColor: "border-blue-300",
    accentColor: "#3b82f6",
    description: "AI 生成公司核心竞争优势",
    inputs: 1,
    outputs: 1,
  },

  // ── Compose 组装 ────────────────────────────────────────────────────
  {
    type: "compose_site",
    label: "站点组装",
    category: "compose",
    icon: "🧩",
    color: "bg-violet-50",
    borderColor: "border-violet-300",
    accentColor: "#8b5cf6",
    description: "将各模块组装为完整站点",
    inputs: 8,
    outputs: 1,
  },

  // ── Output 输出 ─────────────────────────────────────────────────────
  {
    type: "output_preview",
    label: "站点预览",
    category: "output",
    icon: "👁",
    color: "bg-emerald-50",
    borderColor: "border-emerald-300",
    accentColor: "#10b981",
    description: "预览生成的站点效果",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "output_publish",
    label: "发布上线",
    category: "output",
    icon: "🚀",
    color: "bg-emerald-50",
    borderColor: "border-emerald-300",
    accentColor: "#10b981",
    description: "发布站点到线上",
    inputs: 1,
    outputs: 0,
  },
];

export function getNodeConfig(type: string): NodeTypeConfig | undefined {
  return NODE_TYPES.find((n) => n.type === type);
}
