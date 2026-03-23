// Injection Molding Machine industry data
// This file contains all industry-specific knowledge for the vertical product

export const INDUSTRY = {
  name: "注塑机",
  nameEn: "Injection Molding Machine",
  slug: "injection-molding",
};

export const PRODUCT_CATEGORIES = [
  {
    id: "servo-hydraulic",
    name: "伺服液压注塑机",
    nameEn: "Servo Hydraulic Injection Molding Machine",
    clampForceRange: "90T - 4000T",
    description:
      "High precision servo-driven hydraulic system with energy saving up to 60%. Suitable for automotive parts, home appliances, and industrial components.",
    descriptionZh:
      "高精度伺服驱动液压系统，节能高达60%。适用于汽车零件、家电及工业组件生产。",
    features: [
      "Servo motor driven",
      "Energy saving 40-60%",
      "High precision ±0.1mm",
      "Low noise < 72dB",
    ],
  },
  {
    id: "toggle",
    name: "肘杆式注塑机",
    nameEn: "Toggle Type Injection Molding Machine",
    clampForceRange: "60T - 3500T",
    description:
      "Five-point toggle clamping mechanism for fast cycle times and high clamping force. Ideal for high-volume production of thin-wall containers and packaging.",
    descriptionZh:
      "五点肘杆合模机构，快速循环和高锁模力。适用于薄壁容器和包装的大批量生产。",
    features: [
      "Fast dry cycle",
      "High clamping force",
      "Stable production",
      "Low maintenance",
    ],
  },
  {
    id: "two-platen",
    name: "二板式注塑机",
    nameEn: "Two Platen Injection Molding Machine",
    clampForceRange: "500T - 6800T",
    description:
      "Compact design with large mold space. Perfect for large automotive parts, pallets, and industrial containers requiring high clamping force.",
    descriptionZh:
      "紧凑设计，大模具空间。适合大型汽车零件、托盘和工业容器等需要高锁模力的产品。",
    features: [
      "Compact footprint",
      "Large mold space",
      "Even clamping force",
      "Easy mold change",
    ],
  },
  {
    id: "all-electric",
    name: "全电动注塑机",
    nameEn: "All Electric Injection Molding Machine",
    clampForceRange: "30T - 850T",
    description:
      "Full electric drive with zero hydraulic oil. Ultra-precision for medical, electronics, and optical components. Clean room compatible.",
    descriptionZh:
      "全电驱动零液压油。超高精度，适用于医疗、电子和光学组件。洁净室兼容。",
    features: [
      "Zero oil, clean production",
      "Ultra precision ±0.01mm",
      "Energy saving 70%+",
      "Clean room ready",
    ],
  },
  {
    id: "vertical",
    name: "立式注塑机",
    nameEn: "Vertical Injection Molding Machine",
    clampForceRange: "15T - 400T",
    description:
      "Vertical clamping with rotary table for insert molding. Ideal for connectors, metal insert parts, and multi-material molding.",
    descriptionZh:
      "立式合模配转盘，适用于嵌件注塑。适合连接器、金属嵌件和多材料成型。",
    features: [
      "Insert molding",
      "Rotary table",
      "Small footprint",
      "Easy operation",
    ],
  },
];

export const TECHNICAL_PARAMS = [
  "Clamping Force (T)",
  "Shot Weight (g)",
  "Screw Diameter (mm)",
  "Injection Pressure (MPa)",
  "Injection Rate (g/s)",
  "Mold Opening Stroke (mm)",
  "Tie Bar Spacing (mm × mm)",
  "Max Mold Height (mm)",
  "Machine Dimensions (L×W×H)",
  "Machine Weight (T)",
  "Motor Power (kW)",
  "Heating Power (kW)",
];

export const CERTIFICATIONS = [
  { name: "CE", desc: "European Conformity" },
  { name: "ISO 9001", desc: "Quality Management System" },
  { name: "ISO 14001", desc: "Environmental Management" },
  { name: "SGS", desc: "Third-party Inspection" },
];

export const TARGET_MARKETS = [
  { name: "东南亚", nameEn: "Southeast Asia", countries: ["Vietnam", "Indonesia", "Thailand", "Philippines", "Malaysia"] },
  { name: "中东", nameEn: "Middle East", countries: ["Turkey", "Saudi Arabia", "UAE", "Iran", "Egypt"] },
  { name: "南美", nameEn: "South America", countries: ["Brazil", "Mexico", "Colombia", "Argentina"] },
  { name: "非洲", nameEn: "Africa", countries: ["Nigeria", "South Africa", "Kenya", "Tanzania"] },
  { name: "南亚", nameEn: "South Asia", countries: ["India", "Bangladesh", "Pakistan"] },
  { name: "东欧", nameEn: "Eastern Europe", countries: ["Russia", "Poland", "Czech Republic"] },
];

export const BUYER_TYPES = [
  { name: "塑料制品工厂", nameEn: "Plastic Products Factory", desc: "生产塑料日用品、包装、汽配件的终端工厂" },
  { name: "贸易商/经销商", nameEn: "Trader / Distributor", desc: "代理销售注塑机的贸易公司" },
  { name: "系统集成商", nameEn: "System Integrator", desc: "提供自动化产线整体解决方案" },
  { name: "品牌制造商", nameEn: "OEM/ODM Manufacturer", desc: "为品牌客户生产塑料制品的代工厂" },
];

export const RFQ_FIELDS = [
  { key: "product_type", label: "Product Category", labelZh: "产品类型", type: "select" },
  { key: "clamping_force", label: "Clamping Force Required", labelZh: "所需锁模力", type: "text", placeholder: "e.g., 200T" },
  { key: "product_application", label: "Application / Products to Produce", labelZh: "应用/生产产品", type: "text", placeholder: "e.g., PP containers, PET preforms" },
  { key: "quantity", label: "Quantity", labelZh: "数量", type: "text", placeholder: "e.g., 2 sets" },
  { key: "delivery_port", label: "Destination Port", labelZh: "目的港", type: "text", placeholder: "e.g., Ho Chi Minh Port" },
  { key: "company_name", label: "Company Name", labelZh: "公司名称", type: "text" },
  { key: "contact_name", label: "Contact Person", labelZh: "联系人", type: "text" },
  { key: "email", label: "Email", labelZh: "邮箱", type: "email" },
  { key: "whatsapp", label: "WhatsApp / Phone", labelZh: "WhatsApp/电话", type: "text" },
  { key: "message", label: "Additional Requirements", labelZh: "补充需求", type: "textarea" },
];

export const FAQ_TEMPLATES = [
  {
    q: "What is the MOQ?",
    a: "Our MOQ is 1 set. We welcome both single machine orders and bulk orders with competitive pricing.",
  },
  {
    q: "Do you provide installation support?",
    a: "Yes, we provide free installation guidance via video call. For on-site installation, our engineers can travel to your factory (travel expenses covered by buyer).",
  },
  {
    q: "What is the lead time?",
    a: "Standard models: 30-45 days. Customized models: 45-60 days. We maintain stock for popular models.",
  },
  {
    q: "What payment terms do you accept?",
    a: "T/T (30% deposit, 70% before shipment), L/C at sight, and Trade Assurance on Alibaba.",
  },
  {
    q: "Do you offer after-sales service?",
    a: "We provide 1-year full warranty, lifetime technical support, and spare parts supply. Remote troubleshooting via video call is available 24/7.",
  },
  {
    q: "Can I visit your factory?",
    a: "Yes, we welcome factory visits. We are located in Ningbo/Zhejiang, China. We can arrange pickup from Ningbo airport or Shanghai Pudong airport.",
  },
];
