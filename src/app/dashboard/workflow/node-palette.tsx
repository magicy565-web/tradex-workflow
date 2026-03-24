"use client";

import { NODE_CATEGORIES, NODE_TYPES, type NodeTypeConfig } from "./node-types";

interface NodePaletteProps {
  onAddNode: (config: NodeTypeConfig) => void;
}

export default function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-black/[0.06] bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          节点面板
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {NODE_CATEGORIES.map((cat) => {
          const nodes = NODE_TYPES.filter((n) => n.category === cat.key);
          return (
            <div key={cat.key}>
              <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${cat.color}`}>
                {cat.label}
              </p>
              <div className="space-y-1.5">
                {nodes.map((node) => (
                  <button
                    key={node.type}
                    onClick={() => onAddNode(node)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/tradex-node", node.type);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg border ${node.borderColor} ${node.color} px-3 py-2 text-left transition-all hover:shadow-sm active:scale-[0.97]`}
                  >
                    <span className="text-base leading-none">{node.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900">{node.label}</p>
                      <p className="truncate text-[10px] text-gray-500">{node.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
