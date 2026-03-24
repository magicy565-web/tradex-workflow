import type { Node, Edge } from "@xyflow/react";
import { NODE_TYPES, type NodeTypeConfig } from "./node-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NodeStatus = "idle" | "running" | "done" | "error";

export interface ExecutionCallbacks {
  onNodeStatusChange: (
    nodeId: string,
    status: NodeStatus,
    error?: string
  ) => void;
  onComplete: (
    siteData: Record<string, unknown> | null,
    error?: string
  ) => void;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Collected input values forwarded to the generate-site API
interface CollectedInputs {
  companyName?: string;
  companyEnName?: string;
  sellingPoints?: string;
  products?: string[];
  markets?: string[];
  email?: string;
  whatsapp?: string;
}

// Shape returned by /api/generate-site
interface GenerateSiteResponse {
  siteData: Record<string, unknown>;
  siteId: string | null;
  subdomain: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNodeTypeConfig(type: string): NodeTypeConfig | undefined {
  return NODE_TYPES.find((n) => n.type === type);
}

/** Get the actual node type from data.nodeType (since all nodes use type="workflowNode") */
function getActualType(node: Node): string {
  return (node.data as Record<string, unknown>)?.nodeType as string ?? "";
}

function getCategoryForNode(node: Node): string | undefined {
  const cfg = getNodeTypeConfig(getActualType(node));
  return cfg?.category;
}

// ---------------------------------------------------------------------------
// Topological sort (Kahn's algorithm)
// ---------------------------------------------------------------------------

export function getTopologicalOrder(nodes: Node[], edges: Edge[]): Node[] {
  // Build adjacency list & in-degree map
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const current = inDegree.get(edge.target) ?? 0;
    inDegree.set(edge.target, current + 1);
    adjacency.get(edge.source)?.push(edge.target);
  }

  // Seed queue with zero in-degree nodes
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const ordered: Node[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) ordered.push(node);

    for (const neighbor of adjacency.get(id) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  return ordered;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateWorkflow(
  nodes: Node[],
  edges: Edge[]
): ValidationResult {
  const errors: string[] = [];

  const hasCompany = nodes.some((n) => getActualType(n) === "input_company");
  if (!hasCompany) {
    errors.push("Workflow must include at least one Company Info input node.");
  }

  const hasAi = nodes.some((n) => getCategoryForNode(n) === "ai");
  if (!hasAi) {
    errors.push("Workflow must include at least one AI generation node.");
  }

  const composeNode = nodes.find((n) => getActualType(n) === "compose_site");
  if (!composeNode) {
    errors.push("Workflow must include a Site Compose node.");
  } else {
    // Compose node must have at least one incoming edge
    const hasIncoming = edges.some((e) => e.target === composeNode.id);
    if (!hasIncoming) {
      errors.push(
        "The Site Compose node must be connected to at least one upstream node."
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Execution engine
// ---------------------------------------------------------------------------

export async function executeWorkflow(
  nodes: Node[],
  edges: Edge[],
  callbacks: ExecutionCallbacks
): Promise<void> {
  // ── Pre-flight validation ───────────────────────────────────────────
  const validation = validateWorkflow(nodes, edges);
  if (!validation.valid) {
    callbacks.onComplete(null, validation.errors.join(" "));
    return;
  }

  const sorted = getTopologicalOrder(nodes, edges);

  // Partition by category, preserving topological order within each group
  const inputNodes = sorted.filter((n) => getCategoryForNode(n) === "input");
  const aiNodes = sorted.filter((n) => getCategoryForNode(n) === "ai");
  const composeNodes = sorted.filter(
    (n) => getCategoryForNode(n) === "compose"
  );
  const outputNodes = sorted.filter((n) => getCategoryForNode(n) === "output");

  // ── Phase 1 – Collect inputs ────────────────────────────────────────
  const collected: CollectedInputs = {};

  try {
    for (const node of inputNodes) {
      callbacks.onNodeStatusChange(node.id, "running");
      await delay(300);

      const data = (node.data ?? {}) as Record<string, unknown>;

      switch (getActualType(node)) {
        case "input_company":
          collected.companyName = (data.companyName as string) || undefined;
          collected.companyEnName = (data.companyNameEn as string) || undefined;
          collected.sellingPoints =
            (data.sellingPoints as string) || undefined;
          break;
        case "input_products": {
          const prods = data.products as { name: string }[] | string[] | undefined;
          if (Array.isArray(prods)) {
            collected.products = prods.map((p) =>
              typeof p === "string" ? p : p.name
            );
          }
          break;
        }
        case "input_markets":
          collected.markets = (data.markets as string[]) || undefined;
          break;
        case "input_contact":
          collected.email = (data.email as string) || undefined;
          collected.whatsapp = (data.whatsapp as string) || undefined;
          break;
      }

      callbacks.onNodeStatusChange(node.id, "done");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    callbacks.onComplete(null, `Input collection failed: ${message}`);
    return;
  }

  // ── Phase 2 – AI generation ─────────────────────────────────────────
  let apiResponse: GenerateSiteResponse | null = null;
  let apiPromise: Promise<Response> | null = null;

  try {
    for (let i = 0; i < aiNodes.length; i++) {
      const node = aiNodes[i];
      callbacks.onNodeStatusChange(node.id, "running");

      // Fire the API call on the first AI node
      if (i === 0) {
        apiPromise = fetch("/api/generate-site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: collected.companyName,
            companyEnName: collected.companyEnName,
            products: collected.products,
            markets: collected.markets,
            sellingPoints: collected.sellingPoints,
            email: collected.email,
            whatsapp: collected.whatsapp,
          }),
        });
      }

      // Stagger the visual progress between AI nodes
      if (i < aiNodes.length - 1) {
        await delay(800);
        callbacks.onNodeStatusChange(node.id, "done");
      }
    }

    // Wait for the API to finish (it may already be done)
    if (!apiPromise) {
      throw new Error("No API call was initiated – missing AI nodes.");
    }

    const response = await apiPromise;
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        (body as Record<string, string>).error ||
          `API returned status ${response.status}`
      );
    }

    apiResponse = (await response.json()) as GenerateSiteResponse;

    // Mark all AI nodes as done (the last one is still "running")
    for (const node of aiNodes) {
      callbacks.onNodeStatusChange(node.id, "done");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Mark the currently-running AI node as error
    const runningAi = aiNodes.find(
      (n) =>
        // The last node that was set to "running" but not yet "done"
        true
    );
    // In practice the last node in the loop is still "running"
    const lastAiNode = aiNodes[aiNodes.length - 1];
    if (lastAiNode) {
      callbacks.onNodeStatusChange(lastAiNode.id, "error", message);
    }

    callbacks.onComplete(null, `AI generation failed: ${message}`);
    return;
  }

  // ── Phase 3 – Compose ───────────────────────────────────────────────
  const siteData: Record<string, unknown> = {
    ...apiResponse.siteData,
    siteId: apiResponse.siteId,
    subdomain: apiResponse.subdomain,
    companyName: collected.companyName,
    companyEnName: collected.companyEnName,
    email: collected.email,
    whatsapp: collected.whatsapp,
  };

  try {
    for (const node of composeNodes) {
      callbacks.onNodeStatusChange(node.id, "running");
      await delay(500);
      callbacks.onNodeStatusChange(node.id, "done");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    callbacks.onComplete(null, `Compose step failed: ${message}`);
    return;
  }

  // ── Phase 4 – Output ───────────────────────────────────────────────
  try {
    for (const node of outputNodes) {
      callbacks.onNodeStatusChange(node.id, "running");

      if (getActualType(node) === "output_publish" && apiResponse.siteId) {
        const res = await fetch("/api/sites/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId: apiResponse.siteId }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as Record<string, string>).error ||
              `Publish API returned status ${res.status}`
          );
        }
      } else {
        // output_preview or output_publish without siteId – just animate
        await delay(400);
      }

      callbacks.onNodeStatusChange(node.id, "done");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Mark the failing output node
    const failedNode = outputNodes.find(() => true);
    if (failedNode) {
      callbacks.onNodeStatusChange(failedNode.id, "error", message);
    }

    callbacks.onComplete(null, `Output step failed: ${message}`);
    return;
  }

  // ── Done ────────────────────────────────────────────────────────────
  callbacks.onComplete(siteData);
}
