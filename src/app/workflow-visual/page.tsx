import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TradeX 建站工作流引擎",
  description: "AI驱动的外贸独立站建站工作流可视化",
};

export default function WorkflowVisualPage() {
  return (
    <iframe
      src="/tradex-workflow.html"
      className="w-full h-screen border-0"
      title="TradeX 建站工作流引擎"
    />
  );
}
