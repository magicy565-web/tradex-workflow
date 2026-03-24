"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Node } from "@xyflow/react";
import { X } from "lucide-react";
import { getNodeConfig } from "./node-types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "tags" | "products";
  placeholder?: string;
}

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onUpdateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

type ExecutionStatus = "idle" | "running" | "success" | "error";

const STATUS_MAP: Record<
  ExecutionStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  idle: {
    label: "未执行",
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
  },
  running: {
    label: "运行中",
    dot: "bg-amber-400 animate-pulse",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  success: {
    label: "成功",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  error: {
    label: "失败",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },
};

/* ------------------------------------------------------------------ */
/*  Debounced‐input hook                                               */
/* ------------------------------------------------------------------ */

function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  ) as T;
}

/* ------------------------------------------------------------------ */
/*  Sub‐components                                                     */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20";

function TextField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);

  // Sync when the selected node changes
  useEffect(() => setLocal(value), [value]);

  const flush = useDebouncedCallback(onChange as never, 400);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {field.label}
      </label>
      <input
        className={inputCls}
        placeholder={field.placeholder}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          (flush as (v: string) => void)(e.target.value);
        }}
      />
    </div>
  );
}

function TextareaField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  const flush = useDebouncedCallback(onChange as never, 400);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {field.label}
      </label>
      <textarea
        className={`${inputCls} resize-none`}
        rows={3}
        placeholder={field.placeholder}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          (flush as (v: string) => void)(e.target.value);
        }}
      />
    </div>
  );
}

function TagsField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {field.label}
      </label>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 rounded-full p-0.5 text-indigo-400 transition hover:bg-indigo-100 hover:text-indigo-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className={inputCls}
        placeholder={field.placeholder ?? "输入后按 Enter 添加"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
      />
    </div>
  );
}

function ProductsField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: { name: string }[];
  onChange: (v: { name: string }[]) => void;
}) {
  const updateProduct = (index: number, name: string) => {
    const next = [...value];
    next[index] = { name };
    onChange(next);
  };

  const removeProduct = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addProduct = () => {
    onChange([...value, { name: "" }]);
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {field.label}
      </label>
      <div className="space-y-2">
        {value.map((product, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className={`${inputCls} flex-1`}
              placeholder="产品名称"
              value={product.name}
              onChange={(e) => updateProduct(idx, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeProduct(idx)}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addProduct}
        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600"
      >
        + 添加产品
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Panel                                                         */
/* ------------------------------------------------------------------ */

export default function NodeConfigPanel({
  selectedNode,
  onUpdateNodeData,
  onClose,
}: NodeConfigPanelProps) {
  /* ---- Empty state ---- */
  if (!selectedNode) {
    return (
      <div className="flex h-full w-80 items-center justify-center border-l border-black/[0.06] bg-white">
        <p className="text-sm text-gray-400">点击节点查看配置</p>
      </div>
    );
  }

  const nodeData = selectedNode.data as Record<string, unknown>;
  const nodeType = nodeData.nodeType as string;
  const config = getNodeConfig(nodeType);

  if (!config) {
    return (
      <div className="flex h-full w-80 items-center justify-center border-l border-black/[0.06] bg-white">
        <p className="text-sm text-gray-400">未知节点类型</p>
      </div>
    );
  }

  const status: ExecutionStatus =
    (nodeData.status as ExecutionStatus) ?? "idle";
  const statusInfo = STATUS_MAP[status];
  const fields = config.fields ?? [];

  // Determine special node behaviours
  const isAiNode = config.category === "ai";
  const isComposeSite = nodeType === "compose_site";
  const isOutputPreview = nodeType === "output_preview";
  const isOutputPublish = nodeType === "output_publish";
  const isOutputNode = config.category === "output";

  /* ---- Field change handler ---- */
  const handleFieldChange = (key: string, value: unknown) => {
    onUpdateNodeData(selectedNode.id, { [key]: value });
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-black/[0.06] bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <span className="text-xl leading-none">{config.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {(nodeData.label as string) || config.label}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Status badge */}
        <div className="px-4 pt-4 pb-3">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`}
            />
            {statusInfo.label}
          </div>
        </div>

        {/* Description */}
        <div className="px-4 pb-4">
          <p className="text-xs leading-relaxed text-gray-500">
            {config.description}
          </p>
        </div>

        <div className="mx-4 border-t border-gray-100" />

        {/* AI node info */}
        {isAiNode && (
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
              <p className="text-xs font-medium text-indigo-600">
                🤖 AI 将自动生成此模块内容
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-indigo-500/80">
                此节点使用 AI 模型处理数据，配置完成后运行工作流即可自动执行。
              </p>
            </div>
          </div>
        )}

        {/* Compose site info */}
        {isComposeSite && (
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
              <p className="text-xs font-medium text-emerald-600">
                🔗 自动组装所有连接的模块
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-500/80">
                此节点将自动收集所有上游模块的输出并组装为完整站点。
              </p>
            </div>
          </div>
        )}

        {/* Output node messages */}
        {isOutputPreview && (
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-600">
                👁 预览将在运行后显示
              </p>
            </div>
          </div>
        )}

        {isOutputPublish && (
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5">
              <p className="text-xs font-medium text-rose-600">
                🚀 发布需要先完成预览
              </p>
            </div>
          </div>
        )}

        {isOutputNode && !isOutputPreview && !isOutputPublish && (
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
              <p className="text-xs font-medium text-emerald-600">
                💾 数据将在工作流运行后输出
              </p>
            </div>
          </div>
        )}

        {/* Configurable fields form */}
        {fields.length > 0 && (
          <>
            <div className="mx-4 mt-4 border-t border-gray-100" />
            <div className="px-4 pt-4 pb-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                配置
              </p>
              {fields.map((field) => {
                const fieldValue = nodeData[field.key];

                switch (field.type) {
                  case "text":
                    return (
                      <TextField
                        key={field.key}
                        field={field}
                        value={(fieldValue as string) ?? ""}
                        onChange={(v) => handleFieldChange(field.key, v)}
                      />
                    );
                  case "textarea":
                    return (
                      <TextareaField
                        key={field.key}
                        field={field}
                        value={(fieldValue as string) ?? ""}
                        onChange={(v) => handleFieldChange(field.key, v)}
                      />
                    );
                  case "tags":
                    return (
                      <TagsField
                        key={field.key}
                        field={field}
                        value={(fieldValue as string[]) ?? []}
                        onChange={(v) => handleFieldChange(field.key, v)}
                      />
                    );
                  case "products":
                    return (
                      <ProductsField
                        key={field.key}
                        field={field}
                        value={
                          (fieldValue as { name: string }[]) ?? []
                        }
                        onChange={(v) => handleFieldChange(field.key, v)}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </>
        )}

        {/* Bottom padding for scroll */}
        <div className="h-6" />
      </div>
    </div>
  );
}
