"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getNodeConfig } from "./node-types";

function WorkflowNode({ data, selected }: NodeProps) {
  const config = getNodeConfig(data.nodeType as string);
  if (!config) return null;

  return (
    <div
      className={`relative min-w-[180px] rounded-xl border-2 ${config.borderColor} ${config.color} px-4 py-3 shadow-sm transition-shadow ${
        selected ? "shadow-lg ring-2 ring-indigo-400 ring-offset-1" : "hover:shadow-md"
      }`}
    >
      {/* Input handles */}
      {config.inputs > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-gray-400"
        />
      )}

      {/* Node content */}
      <div className="flex items-center gap-2.5">
        <span className="text-xl leading-none">{config.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {(data.label as string) || config.label}
          </p>
          <p className="text-[11px] text-gray-500 truncate">{config.description}</p>
        </div>
      </div>

      {/* Output handles */}
      {config.outputs === 1 && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-indigo-500"
        />
      )}
      {config.outputs === 2 && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            style={{ top: "35%" }}
            className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-emerald-500"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            style={{ top: "65%" }}
            className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-red-400"
          />
          {/* Yes/No labels */}
          <span className="absolute -right-8 text-[10px] font-medium text-emerald-600" style={{ top: "28%" }}>
            是
          </span>
          <span className="absolute -right-8 text-[10px] font-medium text-red-500" style={{ top: "58%" }}>
            否
          </span>
        </>
      )}
    </div>
  );
}

export default memo(WorkflowNode);
