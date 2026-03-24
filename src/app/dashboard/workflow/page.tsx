"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  BackgroundVariant,
  Panel,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import WorkflowNode from "./workflow-node";
import NodePalette from "./node-palette";
import NodeConfigPanel from "./node-config-panel";
import { getNodeConfig, type NodeTypeConfig } from "./node-types";
import { executeWorkflow, validateWorkflow } from "./workflow-engine";
import {
  Play,
  Trash2,
  RotateCcw,
  FileDown,
  FileUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Default workflow — a real site-building pipeline                   */
/* ------------------------------------------------------------------ */

const DEFAULT_NODES: Node[] = [
  { id: "n1", type: "workflowNode", position: { x: 0, y: 0 },
    data: { nodeType: "input_company", label: "公司信息", status: "idle",
      companyName: "宁波精密注塑机械有限公司",
      companyNameEn: "Ningbo Precision Injection Machinery Co., Ltd.",
      sellingPoints: "20年出口经验\nCE / ISO 9001 认证\n全球3000+客户" } },
  { id: "n2", type: "workflowNode", position: { x: 0, y: 130 },
    data: { nodeType: "input_products", label: "产品数据", status: "idle",
      products: [
        { name: "Servo Hydraulic Injection Molding Machine" },
        { name: "All-Electric Injection Molding Machine" },
        { name: "Two-Platen Injection Molding Machine" },
      ] } },
  { id: "n3", type: "workflowNode", position: { x: 0, y: 260 },
    data: { nodeType: "input_markets", label: "目标市场", status: "idle",
      markets: ["Southeast Asia", "South America", "Middle East"] } },
  { id: "n4", type: "workflowNode", position: { x: 0, y: 390 },
    data: { nodeType: "input_contact", label: "联系方式", status: "idle",
      email: "sales@nb-precision.com", whatsapp: "+86 138 0000 0000" } },
  { id: "n5", type: "workflowNode", position: { x: 340, y: 0 },
    data: { nodeType: "ai_hero", label: "AI Hero 文案", status: "idle" } },
  { id: "n6", type: "workflowNode", position: { x: 340, y: 100 },
    data: { nodeType: "ai_products", label: "AI 产品描述", status: "idle" } },
  { id: "n7", type: "workflowNode", position: { x: 340, y: 200 },
    data: { nodeType: "ai_about", label: "AI 公司介绍", status: "idle" } },
  { id: "n8", type: "workflowNode", position: { x: 340, y: 300 },
    data: { nodeType: "ai_faq", label: "AI FAQ 生成", status: "idle" } },
  { id: "n9", type: "workflowNode", position: { x: 340, y: 400 },
    data: { nodeType: "ai_seo", label: "AI SEO 优化", status: "idle" } },
  { id: "n10", type: "workflowNode", position: { x: 340, y: 500 },
    data: { nodeType: "ai_why_us", label: "AI 优势提炼", status: "idle" } },
  { id: "n11", type: "workflowNode", position: { x: 700, y: 180 },
    data: { nodeType: "compose_site", label: "站点组装", status: "idle" } },
  { id: "n12", type: "workflowNode", position: { x: 1000, y: 150 },
    data: { nodeType: "output_preview", label: "站点预览", status: "idle" } },
  { id: "n13", type: "workflowNode", position: { x: 1000, y: 290 },
    data: { nodeType: "output_publish", label: "发布上线", status: "idle" } },
];

const edgeStyle = { stroke: "#6366f1", strokeWidth: 2 };
const edgeMarker = { type: MarkerType.ArrowClosed as const, color: "#6366f1" };

const DEFAULT_EDGES: Edge[] = [
  { id: "e1-5", source: "n1", target: "n5", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e2-6", source: "n2", target: "n6", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e1-7", source: "n1", target: "n7", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e1-8", source: "n1", target: "n8", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e1-9", source: "n1", target: "n9", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e1-10", source: "n1", target: "n10", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e5-11", source: "n5", target: "n11", targetHandle: "in-0", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e6-11", source: "n6", target: "n11", targetHandle: "in-1", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e7-11", source: "n7", target: "n11", targetHandle: "in-2", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e8-11", source: "n8", target: "n11", targetHandle: "in-3", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e9-11", source: "n9", target: "n11", targetHandle: "in-4", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e10-11", source: "n10", target: "n11", targetHandle: "in-5", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e3-11", source: "n3", target: "n11", targetHandle: "in-6", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e4-11", source: "n4", target: "n11", targetHandle: "in-7", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e11-12", source: "n11", target: "n12", style: edgeStyle, markerEnd: edgeMarker },
  { id: "e12-13", source: "n12", target: "n13", style: edgeStyle, markerEnd: edgeMarker },
];

let _nextId = 100;
function nextId() { return `n${++_nextId}`; }

const defaultEdgeOptions = { style: edgeStyle, markerEnd: edgeMarker };

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WorkflowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNodeId(null), []);

  const handleUpdateNodeData = useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n));
    },
    [setNodes],
  );

  const handleAddNode = useCallback((config: NodeTypeConfig) => {
    const id = nextId();
    const defaults: Record<string, unknown> = {};
    if (config.fields) {
      for (const f of config.fields) {
        if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
        else if (f.type === "tags") defaults[f.key] = [];
        else if (f.type === "products") defaults[f.key] = [];
        else defaults[f.key] = "";
      }
    }
    setNodes((nds) => [...nds, {
      id, type: "workflowNode",
      position: { x: 300 + Math.random() * 200, y: 100 + Math.random() * 300 },
      data: { nodeType: config.type, label: config.label, status: "idle", ...defaults },
    }]);
    setSelectedNodeId(id);
  }, [setNodes]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData("application/tradex-node");
    if (!nodeType || !rfInstance || !wrapperRef.current) return;
    const config = getNodeConfig(nodeType);
    if (!config) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = rfInstance.screenToFlowPosition({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    const defaults: Record<string, unknown> = {};
    if (config.fields) {
      for (const f of config.fields) {
        if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
        else if (f.type === "tags") defaults[f.key] = [];
        else if (f.type === "products") defaults[f.key] = [];
        else defaults[f.key] = "";
      }
    }
    const id = nextId();
    setNodes((nds) => [...nds, {
      id, type: "workflowNode", position,
      data: { nodeType: config.type, label: config.label, status: "idle", ...defaults },
    }]);
    setSelectedNodeId(id);
  }, [rfInstance, setNodes]);

  const handleRun = useCallback(async () => {
    const validation = validateWorkflow(nodes, edges);
    if (!validation.valid) {
      setRunResult({ type: "error", message: validation.errors[0] });
      return;
    }
    setRunning(true);
    setRunResult(null);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "idle", error: undefined } })));
    await new Promise((r) => setTimeout(r, 200));

    await executeWorkflow(nodes, edges, {
      onNodeStatusChange: (nodeId, status, error) => {
        setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status, error } } : n));
      },
      onComplete: (siteData, error) => {
        setRunning(false);
        if (error) {
          setRunResult({ type: "error", message: error });
        } else if (siteData) {
          const sub = siteData.subdomain as string;
          setRunResult({ type: "success", message: sub ? `站点生成成功! 访问 /site/${sub} 查看` : "站点内容生成成功!" });
        }
      },
    });
  }, [nodes, edges, setNodes]);

  const handleReset = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "idle", error: undefined } })));
    setRunResult(null);
  }, [setNodes]);

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const handleExport = useCallback(() => {
    if (!rfInstance) return;
    const flow = rfInstance.toObject();
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tradex-workflow.json"; a.click();
    URL.revokeObjectURL(url);
  }, [rfInstance]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const flow = JSON.parse(await file.text());
        if (flow.nodes) setNodes(flow.nodes);
        if (flow.edges) setEdges(flow.edges);
      } catch { /* ignore */ }
    };
    input.click();
  }, [setNodes, setEdges]);

  const btnCls = "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.97] disabled:opacity-50";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden -m-6">
      <NodePalette onAddNode={handleAddNode} />

      <div className="flex-1" ref={wrapperRef}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onInit={setRfInstance}
          onNodeClick={onNodeClick} onPaneClick={onPaneClick}
          onDragOver={onDragOver} onDrop={onDrop}
          nodeTypes={nodeTypes} defaultEdgeOptions={defaultEdgeOptions}
          fitView fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={["Backspace", "Delete"]}
          className="bg-gray-50/80"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
          <Controls className="!rounded-lg !border !border-gray-200 !shadow-sm" />
          <MiniMap
            className="!rounded-lg !border !border-gray-200 !shadow-sm"
            nodeColor={(n) => {
              const cfg = getNodeConfig((n.data as Record<string, unknown>)?.nodeType as string);
              return cfg?.accentColor ?? "#e5e7eb";
            }}
            maskColor="rgba(255,255,255,0.7)"
          />

          <Panel position="top-right" className="flex flex-wrap items-center gap-2">
            <button onClick={handleExport} className={btnCls} disabled={running}>
              <FileDown className="h-3.5 w-3.5" /> 导出
            </button>
            <button onClick={handleImport} className={btnCls} disabled={running}>
              <FileUp className="h-3.5 w-3.5" /> 导入
            </button>
            <button onClick={handleDelete} className={btnCls} disabled={running}>
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
            <button onClick={handleReset} className={btnCls} disabled={running}>
              <RotateCcw className="h-3.5 w-3.5" /> 重置
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <button onClick={handleRun} disabled={running}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition active:scale-[0.97] disabled:opacity-60 ${running ? "bg-amber-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {running
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 运行中...</>
                : <><Play className="h-3.5 w-3.5" /> 运行工作流</>}
            </button>
          </Panel>

          {runResult && (
            <Panel position="top-center" className="!mt-2">
              <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${runResult.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {runResult.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{runResult.message}</span>
                <button onClick={() => setRunResult(null)} className="ml-2 rounded p-0.5 hover:bg-black/5">&times;</button>
              </div>
            </Panel>
          )}

          <Panel position="bottom-left" className="!mb-0 !ml-0">
            <div className="flex items-center gap-4 rounded-tr-lg border-t border-r border-gray-200 bg-white/90 px-4 py-2 text-[11px] text-gray-500 backdrop-blur">
              <span>节点: {nodes.length}</span>
              <span>连线: {edges.length}</span>
              <span className="flex items-center gap-1">
                {running
                  ? <><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> 执行中</>
                  : <><span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> 就绪</>}
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <NodeConfigPanel
        selectedNode={selectedNode}
        onUpdateNodeData={handleUpdateNodeData}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
}
