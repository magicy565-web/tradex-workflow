import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TradeX 智能建站工作流",
  description: "AI驱动的外贸独立站，从信息输入到上线获客的全流程可视化",
};

export default function WorkflowVisualPage() {
  return (
    <iframe
      src="/tradex-workflow.html"
      className="w-full h-screen border-0"
      title="TradeX 智能建站工作流"
    />
  );
}
