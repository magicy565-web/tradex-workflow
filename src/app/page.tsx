import Link from "next/link";
import ChatSection from "./chat-section";

const steps = [
  {
    num: "01",
    title: "描述你的业务",
    desc: "填写产品类型、目标市场、公司信息",
  },
  {
    num: "02",
    title: "AI 自动生成",
    desc: "首页、产品页、询盘表单、SEO结构一键生成",
  },
  {
    num: "03",
    title: "上线获客",
    desc: "站点即刻上线，询盘直达企业微信",
  },
];

const categories = [
  "伺服液压注塑机",
  "肘杆式注塑机",
  "二板式注塑机",
  "全电动注塑机",
  "立式注塑机",
];

const features = [
  "专业产品展示页（含技术参数表）",
  "RFQ 询盘表单（预置注塑机行业字段）",
  "多语言支持（中/英）",
  "SEO 基础优化",
  "WhatsApp 一键沟通",
  "企业微信通知",
];

const plans = [
  {
    name: "基础版",
    price: "299",
    items: ["1个站点", "基础模板", "询盘表单", "企微通知"],
  },
  {
    name: "专业版",
    price: "799",
    items: ["3个站点", "全部模板", "自定义域名", "优先支持"],
    highlighted: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafc]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            TradeX
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            开始建站
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            对话式生成 B2B 外贸独立站
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
            和 AI 聊几句，描述你的业务，自动生成专业外贸网站。带询盘表单，能收线索，即刻开始获客。
          </p>
          <div className="mt-10">
            <Link
              href="/auth/register"
              className="inline-block rounded-lg bg-indigo-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-700"
            >
              免费试用 7 天 &rarr;
            </Link>
          </div>

          <ChatSection />
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            三步上线
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-black/[0.06] bg-white p-8"
              >
                <span className="font-mono text-sm font-semibold text-indigo-600">
                  {step.num}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry focus */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            专为注塑机行业打造
          </h2>
          <div className="mt-16 flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <div
                key={cat}
                className="rounded-xl border border-black/[0.06] bg-white px-6 py-4 text-sm font-medium text-gray-900"
              >
                {cat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            你将获得
          </h2>
          <div className="mx-auto mt-16 grid max-w-2xl gap-4 sm:grid-cols-2">
            {features.map((feat) => (
              <div
                key={feat}
                className="flex items-start gap-3 rounded-xl border border-black/[0.06] bg-white px-5 py-4"
              >
                <span className="mt-0.5 text-indigo-600">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.5 4.5L6 12L2.5 8.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-sm text-gray-900">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            定价
          </h2>
          <div className="mx-auto mt-16 grid max-w-2xl gap-8 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border bg-white p-8 ${
                  plan.highlighted
                    ? "border-indigo-600 ring-1 ring-indigo-600"
                    : "border-black/[0.06]"
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold text-gray-900">
                    &yen;{plan.price}
                  </span>
                  <span className="text-sm text-gray-500">/月</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-500"
                    >
                      <span className="text-indigo-600">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.5 4.5L6 12L2.5 8.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`mt-8 block rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-black/[0.06] text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  开始使用
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-12">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-500">
          &copy; 2026 TradeX. 专为注塑机行业打造的B2B建站工具。
        </div>
      </footer>
    </div>
  );
}
