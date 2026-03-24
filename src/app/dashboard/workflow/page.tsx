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
import { NODE_TYPES, getNodeConfig, type NodeTypeConfig } from "./node-types";
import { Play, Save, Trash2, Undo2, FileDown, FileUp, ZapOff, Zap } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Preset demo workflow                                              */
/* ------------------------------------------------------------------ */

const DEMO_NODES: Node[] = [
  {
    id: "1",
    type: "workflowNode",
    position: { x: 50, y: 180 },
    data: { label: "新询盘", nodeType: "trigger_inquiry" },
  },
  {
    id: "2",
    type: "workflowNode",
    position: { x: 330, y: 180 },
    data: { label: "AI 翻译", nodeType: "action_translate" },
  },
  {
    id: "3",
    type: "workflowNode",
    position: { x: 610, y: 180 },
    data: { label: "线索评分", nodeType: "action_score_lead" },
  },
  {
    id: "4",
    type: "workflowNode",
    position: { x: 910, y: 120 },
    data: { label: "询盘金额", nodeType: "condition_amount" },
  },
  {
    id: "5",
    type: "workflowNode",
    position: { x: 1220, y: 50 },
    data: { label: "AI 智能回复", nodeType: "action_ai_reply" },
  },
  {
    id: "6",
    type: "workflowNode",
    position: { x: 1220, y: 220 },
    data: { label: "企微通知", nodeType: "action_wecom" },
  },
  {
    id: "7",
    type: "workflowNode",
    position: { x: 1520, y: 50 },
    data: { label: "发送邮件", nodeType: "action_send_email" },
  },
  {
    id: "8",
    type: "workflowNode",
    position: { x: 1520, y: 220 },
    data: { label: "保存到 CRM", nodeType: "output_crm" },
  },
];

const DEMO_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#6366f1", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" } },
  { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#6366f1", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" } },
  { id: "e3-4", source: "3", target: "4", animated: true, style: { stroke: "#6366f1", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" } },
  { id: "e4-5", source: "4", sourceHandle: "yes", target: "5", style: { stroke: "#10b981", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" } },
  { id: "e4-6", source: "4", sourceHandle: "no", target: "6", style: { stroke: "#ef4444", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444" } },
  { id: "e5-7", source: "5", target: "7", style: { stroke: "#6366f1", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" } },
  { id: "e6-8", source: "6", target: "8", style: { stroke: "#6366f1", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" } },
];

/* ------------------------------------------------------------------ */
/*  Main Editor                                                       */
/* ------------------------------------------------------------------ */

let nodeId = 100;
function getNextId() {
  return String(++nodeId);
}

const defaultEdgeOptions = {
  style: { stroke: "#6366f1", strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed as const, color: "#6366f1" },
  animated: false,
};

export default function WorkflowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEMO_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEMO_EDGES);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [workflowActive, setWorkflowActive] = useState(false);
  const [saved, setSaved] = useState(false);

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  // Add node from palette (click)
  const handleAddNode = useCallback(
    (config: NodeTypeConfig) => {
      const id = getNextId();
      const newNode: Node = {
        id,
        type: "workflowNode",
        position: { x: 300 + Math.random() * 200, y: 150 + Math.random() * 200 },
        data: { label: config.label, nodeType: config.type },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // Drop from palette (drag)
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("application/tradex-node");
      if (!nodeType || !rfInstance || !reactFlowWrapper.current) return;

      const config = getNodeConfig(nodeType);
      if (!config) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const id = getNextId();
      const newNode: Node = {
        id,
        type: "workflowNode",
        position,
        data: { label: config.label, nodeType: config.type },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [rfInstance, setNodes]
  );

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  // Clear all
  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // Save (mock)
  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  // Export
  const handleExport = useCallback(() => {
    if (!rfInstance) return;
    const flow = rfInstance.toObject();
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [rfInstance]);

  // Import
  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const flow = JSON.parse(text);
        if (flow.nodes) setNodes(flow.nodes);
        if (flow.edges) setEdges(flow.edges);
      } catch {
        // ignore invalid JSON
      }
    };
    input.click();
  }, [setNodes, setEdges]);

  const btnCls =
    "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.97]";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden -m-6">
      {/* Left: Node Palette */}
      <NodePalette onAddNode={handleAddNode} />

      {/* Right: Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          deleteKeyCode={["Backspace", "Delete"]}
          className="bg-gray-50/80"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
          <Controls className="!rounded-lg !border !border-gray-200 !shadow-sm" />
          <MiniMap
            className="!rounded-lg !border !border-gray-200 !shadow-sm"
            nodeColor={(n) => {
              const cfg = getNodeConfig(n.data?.nodeType as string);
              if (!cfg) return "#e5e7eb";
              if (cfg.category === "trigger") return "#fb923c";
              if (cfg.category === "action") return "#60a5fa";
              if (cfg.category === "condition") return "#a78bfa";
              return "#34d399";
            }}
            maskColor="rgba(255,255,255,0.7)"
          />

          {/* Toolbar */}
          <Panel position="top-right" className="flex items-center gap-2">
            <button onClick={handleSave} className={btnCls}>
              <Save className="h-3.5 w-3.5" />
              {saved ? "已保存" : "保存"}
            </button>
            <button onClick={handleExport} className={btnCls}>
              <FileDown className="h-3.5 w-3.5" />
              导出
            </button>
            <button onClick={handleImport} className={btnCls}>
              <FileUp className="h-3.5 w-3.5" />
              导入
            </button>
            <button onClick={handleDeleteSelected} className={btnCls}>
              <Trash2 className="h-3.5 w-3.5" />
              删除
            </button>
            <button onClick={handleClear} className={`${btnCls} !text-red-600 hover:!bg-red-50`}>
              <Undo2 className="h-3.5 w-3.5" />
              清空
            </button>
            <div className="ml-2 h-5 w-px bg-gray-200" />
            <button
              onClick={() => setWorkflowActive(!workflowActive)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition active:scale-[0.97] ${
                workflowActive
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {workflowActive ? (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  运行中
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  启动
                </>
              )}
            </button>
          </Panel>

          {/* Status bar */}
          <Panel position="bottom-left" className="!mb-0 !ml-0">
            <div className="flex items-center gap-4 rounded-tr-lg border-t border-r border-gray-200 bg-white/90 px-4 py-2 text-[11px] text-gray-500 backdrop-blur">
              <span>节点: {nodes.length}</span>
              <span>连线: {edges.length}</span>
              <span className="flex items-center gap-1">
                状态:{" "}
                {workflowActive ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    运行中
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                    未启动
                  </>
                )}
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
