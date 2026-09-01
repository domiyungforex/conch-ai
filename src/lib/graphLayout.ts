// Force-directed graph layout — improved with category clustering.
// Nodes of the same type cluster together, connected nodes attract,
// and unrelated nodes repel — producing a meaningful layout.

export interface GraphNode {
  id: string;
  label: string;
  type: "memory" | "project" | "decision" | "constraint" | "agent" | "task";
  importance: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NODE_RADIUS: Record<GraphNode["type"], number> = {
  memory: 7,
  project: 13,
  decision: 10,
  constraint: 9,
  agent: 12,
  task: 7,
};

export function getNodeRadius(type: GraphNode["type"]): number {
  return NODE_RADIUS[type] ?? 8;
}

export const NODE_COLORS: Record<GraphNode["type"], string> = {
  memory: "#c8891f",
  project: "#6366f1",
  decision: "#10b981",
  constraint: "#ef4444",
  agent: "#8b5cf6",
  task: "#06b6d4",
};

// Category center positions — arranged in a circle for clear grouping
const CATEGORY_ANGLES: Record<string, number> = {
  memory: 0,
  project: Math.PI / 3,
  decision: (2 * Math.PI) / 3,
  constraint: Math.PI,
  agent: (4 * Math.PI) / 3,
  task: (5 * Math.PI) / 3,
};

// Initialize positions based on category — place nodes near their category center
export function initializePositions(data: GraphData, width: number, height: number): GraphData {
  const cx = width / 2;
  const cy = height / 2;
  const clusterRadius = Math.min(width, height) * 0.28;
  const spreadRadius = Math.min(width, height) * 0.08;

  // Group nodes by type
  const groups = new Map<string, GraphNode[]>();
  for (const node of data.nodes) {
    if (!groups.has(node.type)) groups.set(node.type, []);
    groups.get(node.type)!.push(node);
  }

  const nodes: GraphNode[] = [];
  for (const [type, group] of groups) {
    const angle = CATEGORY_ANGLES[type] ?? 0;
    const groupCx = cx + Math.cos(angle) * clusterRadius;
    const groupCy = cy + Math.sin(angle) * clusterRadius;

    for (let i = 0; i < group.length; i++) {
      const nodeAngle = (i / Math.max(group.length, 1)) * Math.PI * 2;
      const r = spreadRadius * Math.sqrt(Math.random()) * 0.8;
      nodes.push({
        ...group[i],
        x: groupCx + Math.cos(nodeAngle) * r,
        y: groupCy + Math.sin(nodeAngle) * r,
        vx: 0,
        vy: 0,
      });
    }
  }

  return { nodes, edges: data.edges };
}

// Run force simulation with category clustering
export function simulate(
  data: GraphData,
  width: number,
  height: number,
  iterations: number = 200
): GraphData {
  const nodes = data.nodes.map((n) => ({ ...n }));
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edges = data.edges;

  const repulsionForce = 600;
  const attractionForce = 0.015;
  const centerForce = 0.008;
  const clusterForce = 0.025; // Pull nodes toward their category center
  const damping = 0.85;
  const minDist = 25;
  const padding = 50;

  const cx = width / 2;
  const cy = height / 2;
  const clusterRadius = Math.min(width, height) * 0.28;

  for (let iter = 0; iter < iterations; iter++) {
    const temp = Math.max(0.1, 1 - iter / iterations);

    // Repulsion between all pairs (stronger at close range)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) dist = minDist;

        // Nodes of same type repel less (stay closer)
        const sameType = a.type === b.type;
        const forceMultiplier = sameType ? 0.5 : 1.2;
        const force = (repulsionForce * temp * forceMultiplier) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (a.fx === undefined) { a.vx += fx; a.vy += fy; }
        if (b.fx === undefined) { b.vx -= fx; b.vy -= fy; }
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;

      const idealDist = 80;
      const force = (dist - idealDist) * attractionForce * temp;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (a.fx === undefined) { a.vx += fx; a.vy += fy; }
      if (b.fx === undefined) { b.vx -= fx; b.vy -= fy; }
    }

    // Category cluster gravity — pull each node toward its category center
    for (const node of nodes) {
      if (node.fx !== undefined) continue;

      const angle = CATEGORY_ANGLES[node.type] ?? 0;
      const targetX = cx + Math.cos(angle) * clusterRadius;
      const targetY = cy + Math.sin(angle) * clusterRadius;

      node.vx += (targetX - node.x) * clusterForce * temp;
      node.vy += (targetY - node.y) * clusterForce * temp;
    }

    // Mild center gravity to prevent drift
    for (const node of nodes) {
      if (node.fx !== undefined) continue;
      node.vx += (cx - node.x) * centerForce;
      node.vy += (cy - node.y) * centerForce;
    }

    // Apply velocities with bounds
    for (const node of nodes) {
      if (node.fx !== undefined) {
        node.x = node.fx;
        node.y = node.fy!;
        node.vx = 0;
        node.vy = 0;
        continue;
      }

      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }

  return { nodes, edges: data.edges };
}

// Hit test: find node at (x, y)
export function hitTest(
  nodes: GraphNode[],
  x: number,
  y: number,
  zoom: number = 1
): GraphNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const r = getNodeRadius(node.type) * zoom;
    const dx = x - node.x;
    const dy = y - node.y;
    if (dx * dx + dy * dy <= (r + 6) * (r + 6)) {
      return node;
    }
  }
  return null;
}
