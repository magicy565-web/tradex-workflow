"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getNodeConfig } from "./node-types";

interface WorkflowNodeData {
  nodeType: string;
  label: string;
  status: "idle" | "running" | "done" | "error";
  error?: string;
  [key: string]: unknown;
}

function StatusIndicator({ status, error }: { status: WorkflowNodeData["status"]; error?: string }) {
  switch (status) {
    case "running":
      return (
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] text-blue-600 font-medium">运行中...</span>
        </div>
      );
    case "done":
      return (
        <div className="flex items-center gap-1">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 text-white text-[8px] leading-none">
            &#10003;
          </span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-1" title={error}>
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-white text-[8px] leading-none font-bold">
            &#10005;
          </span>
        </div>
      );
    case "idle":
    default:
      return <span className="h-2 w-2 rounded-full bg-gray-300" />;
  }
}

function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = getNodeConfig(nodeData.nodeType);
  if (!config) return null;

  const isComposeSite = nodeData.nodeType === "compose_site";

  return (
    <div
      className={[
        "relative rounded-xl border-2 px-4 py-3 shadow-sm transition-shadow",
        isComposeSite ? "min-w-[220px]" : "min-w-[200px]",
        config.borderColor,
        isComposeSite ? "bg-gradient-to-br from-white via-indigo-50/60 to-purple-50/40" : config.color,
        selected
          ? "ring-2 ring-indigo-400 ring-offset-1 shadow-lg"
          : "hover:shadow-md",
      ].join(" ")}
    >
      {/* ---- Input handles (left) ---- */}
      {config.inputs > 0 &&
        (isComposeSite ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Handle
              key={`in-${i}`}
              id={`in-${i}`}
              type="target"
              position={Position.Left}
              style={{ top: `${((i + 1) / 9) * 100}%` }}
              className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-gray-400"
            />
          ))
        ) : (
          <Handle
            type="target"
            position={Position.Left}
            className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-gray-400"
          />
        ))}

      {/* ---- Node content ---- */}
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none mt-0.5">{config.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {nodeData.label || config.label}
          </p>
          <p className="text-[11px] text-gray-500 truncate">{config.description}</p>
        </div>
      </div>

      {/* ---- Status indicator (bottom-right) ---- */}
      <div className="absolute bottom-1.5 right-2">
        <StatusIndicator status={nodeData.status} error={nodeData.error} />
      </div>

      {/* ---- Output handles (right) ---- */}
      {config.outputs > 0 && (
        config.outputs === 1 ? (
          <Handle
            type="source"
            position={Position.Right}
            className={`!h-3.5 !w-3.5 !rounded-full !border-2 !border-white ${config.borderColor.replace("border-", "!bg-").replace("-300", "-500")}`}
          />
        ) : (
          <>
            <Handle
              type="source"
              position={Position.Right}
              id="yes"
              style={{ top: "35%" }}
              className={`!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-emerald-500`}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="no"
              style={{ top: "65%" }}
              className={`!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-red-400`}
            />
            <span
              className="absolute -right-8 text-[10px] font-medium text-emerald-600"
              style={{ top: "28%" }}
            >
              是
            </span>
            <span
              className="absolute -right-8 text-[10px] font-medium text-red-500"
              style={{ top: "58%" }}
            >
              否
            </span>
          </>
        )
      )}
    </div>
  );
}

export default memo(WorkflowNode);
