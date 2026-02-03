import dagre from 'dagre';
import { buildCIDRHierarchy, getNodeCIDR, parseCIDR } from './networkUtils';

/**
 * Layout algorithm options
 */
export const LayoutTypes = {
  HIERARCHICAL_TB: 'hierarchical-tb',
  HIERARCHICAL_LR: 'hierarchical-lr',
  FORCE_DIRECTED: 'force-directed',
  GRID: 'grid',
  RADIAL: 'radial',
  CIDR_TREE: 'cidr-tree',
};

export const LayoutLabels = {
  [LayoutTypes.HIERARCHICAL_TB]: 'Hierarchical (Top-Bottom)',
  [LayoutTypes.HIERARCHICAL_LR]: 'Hierarchical (Left-Right)',
  [LayoutTypes.FORCE_DIRECTED]: 'Force Directed',
  [LayoutTypes.GRID]: 'Grid',
  [LayoutTypes.RADIAL]: 'Radial',
  [LayoutTypes.CIDR_TREE]: 'CIDR Tree (Auto)',
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

/**
 * Hierarchical layout using dagre
 */
function hierarchicalLayout(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
}

/**
 * Simple force-directed layout simulation
 */
function forceDirectedLayout(nodes, edges, iterations = 100) {
  if (nodes.length === 0) return [];

  // Initialize positions randomly if not set
  let positions = nodes.map((node, i) => ({
    id: node.id,
    x: node.position?.x || Math.cos((2 * Math.PI * i) / nodes.length) * 300,
    y: node.position?.y || Math.sin((2 * Math.PI * i) / nodes.length) * 300,
    vx: 0,
    vy: 0,
  }));

  const posMap = new Map(positions.map((p) => [p.id, p]));

  // Build adjacency for attraction
  const adjacency = new Map();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source).push(edge.target);
    adjacency.get(edge.target).push(edge.source);
  });

  const repulsionStrength = 5000;
  const attractionStrength = 0.05;
  const damping = 0.85;
  const idealDistance = 200;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsionStrength / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        positions[i].vx -= fx;
        positions[i].vy -= fy;
        positions[j].vx += fx;
        positions[j].vy += fy;
      }
    }

    // Attraction along edges
    edges.forEach((edge) => {
      const source = posMap.get(edge.source);
      const target = posMap.get(edge.target);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - idealDistance) * attractionStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    // Apply velocities and damping
    positions.forEach((pos) => {
      pos.x += pos.vx;
      pos.y += pos.vy;
      pos.vx *= damping;
      pos.vy *= damping;
    });
  }

  // Center the layout
  const minX = Math.min(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  const offsetX = -minX + 100;
  const offsetY = -minY + 100;

  return nodes.map((node) => {
    const pos = posMap.get(node.id);
    return {
      ...node,
      position: {
        x: pos.x + offsetX,
        y: pos.y + offsetY,
      },
    };
  });
}

/**
 * Grid layout - arranges nodes in a grid pattern
 */
function gridLayout(nodes, columns = 0) {
  if (nodes.length === 0) return [];

  const cols = columns || Math.ceil(Math.sqrt(nodes.length));
  const cellWidth = NODE_WIDTH + 80;
  const cellHeight = NODE_HEIGHT + 60;

  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      ...node,
      position: {
        x: col * cellWidth + 100,
        y: row * cellHeight + 100,
      },
    };
  });
}

/**
 * Radial layout - arranges nodes in concentric circles
 * Center node is determined by: first CIDR node, or first device, or first node
 */
function radialLayout(nodes, edges) {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: { x: 400, y: 300 } }];
  }

  // Find center node (prefer CIDR, then device, then first)
  let centerNode = nodes.find((n) => n.type === 'cidr') ||
    nodes.find((n) => n.type === 'device') ||
    nodes[0];

  // Build connection levels using BFS
  const levels = new Map();
  const visited = new Set();
  const queue = [{ id: centerNode.id, level: 0 }];
  visited.add(centerNode.id);
  levels.set(centerNode.id, 0);

  const adjacency = new Map();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source).push(edge.target);
    adjacency.get(edge.target).push(edge.source);
  });

  while (queue.length > 0) {
    const { id, level } = queue.shift();
    const neighbors = adjacency.get(id) || [];
    neighbors.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        levels.set(neighborId, level + 1);
        queue.push({ id: neighborId, level: level + 1 });
      }
    });
  }

  // Assign unconnected nodes to outer ring
  const maxLevel = Math.max(...levels.values(), 0);
  nodes.forEach((node) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, maxLevel + 1);
    }
  });

  // Group nodes by level
  const levelGroups = new Map();
  nodes.forEach((node) => {
    const level = levels.get(node.id);
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level).push(node);
  });

  // Position nodes
  const centerX = 500;
  const centerY = 400;
  const radiusStep = 180;

  const result = [];
  levelGroups.forEach((groupNodes, level) => {
    if (level === 0) {
      result.push({
        ...groupNodes[0],
        position: { x: centerX - NODE_WIDTH / 2, y: centerY - NODE_HEIGHT / 2 },
      });
    } else {
      const radius = level * radiusStep;
      const angleStep = (2 * Math.PI) / groupNodes.length;
      groupNodes.forEach((node, index) => {
        const angle = index * angleStep - Math.PI / 2;
        result.push({
          ...node,
          position: {
            x: centerX + Math.cos(angle) * radius - NODE_WIDTH / 2,
            y: centerY + Math.sin(angle) * radius - NODE_HEIGHT / 2,
          },
        });
      });
    }
  });

  return result;
}

/**
 * CIDR Tree layout - arranges nodes based on IP/CIDR hierarchy
 * Creates a tree structure: Internet/Root -> larger CIDRs -> smaller CIDRs -> IP nodes
 *
 * @param {Array} nodes - ReactFlow nodes
 * @param {Array} edges - ReactFlow edges (optional, will auto-generate if needed)
 * @returns {{ nodes: Array, edges: Array }} - Nodes with positions and hierarchy edges
 */
function cidrTreeLayout(nodes, edges) {
  if (nodes.length === 0) return { nodes: [], edges: [] };

  // Build hierarchy
  const { edges: hierarchyEdges, hierarchy } = buildCIDRHierarchy(nodes);

  // Merge hierarchy edges with existing non-auto edges
  const manualEdges = edges.filter((e) => !e.data?.auto);
  const edgeSet = new Set(manualEdges.map((e) => `${e.source}-${e.target}`));
  const mergedEdges = [...manualEdges];

  for (const edge of hierarchyEdges) {
    const key = `${edge.source}-${edge.target}`;
    const reverseKey = `${edge.target}-${edge.source}`;
    if (!edgeSet.has(key) && !edgeSet.has(reverseKey)) {
      mergedEdges.push(edge);
      edgeSet.add(key);
    }
  }

  // Build tree structure for layout
  const children = new Map(); // parentId -> [childIds]
  const hasParent = new Set();

  for (const [childId, parentId] of hierarchy.entries()) {
    if (!children.has(parentId)) children.set(parentId, []);
    children.get(parentId).push(childId);
    hasParent.add(childId);
  }

  // Find root nodes (no parent in hierarchy)
  const roots = nodes.filter((n) => !hasParent.has(n.id));

  // Sort roots: CIDR nodes first (by prefix size, smallest first for largest network)
  roots.sort((a, b) => {
    const aIsCidr = a.type === 'cidr';
    const bIsCidr = b.type === 'cidr';
    if (aIsCidr && !bIsCidr) return -1;
    if (!aIsCidr && bIsCidr) return 1;
    if (aIsCidr && bIsCidr) {
      const aCidr = getNodeCIDR(a);
      const bCidr = getNodeCIDR(b);
      const aPrefix = aCidr ? parseCIDR(aCidr)?.prefix ?? 32 : 32;
      const bPrefix = bCidr ? parseCIDR(bCidr)?.prefix ?? 32 : 32;
      return aPrefix - bPrefix;
    }
    return 0;
  });

  // Calculate tree depth and width for each subtree
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function getSubtreeInfo(nodeId, depth = 0) {
    const childIds = children.get(nodeId) || [];

    if (childIds.length === 0) {
      return { depth: depth, width: 1, maxDepth: depth };
    }

    let totalWidth = 0;
    let maxChildDepth = depth;

    for (const childId of childIds) {
      const info = getSubtreeInfo(childId, depth + 1);
      totalWidth += info.width;
      maxChildDepth = Math.max(maxChildDepth, info.maxDepth);
    }

    return { depth, width: totalWidth, maxDepth: maxChildDepth };
  }

  // Layout parameters
  const LEVEL_HEIGHT = 150;
  const NODE_WIDTH_SPACING = 220;
  const SUBTREE_PADDING = 40;

  // Position nodes using recursive algorithm
  const positions = new Map();

  function layoutSubtree(nodeId, startX, depth) {
    const childIds = children.get(nodeId) || [];

    if (childIds.length === 0) {
      positions.set(nodeId, { x: startX, y: depth * LEVEL_HEIGHT + 50 });
      return NODE_WIDTH_SPACING;
    }

    // Sort children: CIDR nodes first, then by name
    const sortedChildren = [...childIds].sort((aId, bId) => {
      const a = nodeMap.get(aId);
      const b = nodeMap.get(bId);
      if (!a || !b) return 0;

      const aIsCidr = a.type === 'cidr';
      const bIsCidr = b.type === 'cidr';
      if (aIsCidr && !bIsCidr) return -1;
      if (!aIsCidr && bIsCidr) return 1;

      return (a.data?.label || '').localeCompare(b.data?.label || '');
    });

    // Layout children
    let currentX = startX;
    for (const childId of sortedChildren) {
      const width = layoutSubtree(childId, currentX, depth + 1);
      currentX += width + SUBTREE_PADDING;
    }

    const totalWidth = currentX - startX - SUBTREE_PADDING;

    // Center parent above children
    const centerX = startX + totalWidth / 2 - NODE_WIDTH / 2;
    positions.set(nodeId, { x: centerX, y: depth * LEVEL_HEIGHT + 50 });

    return totalWidth;
  }

  // Layout all root subtrees
  let currentX = 100;
  for (const root of roots) {
    const width = layoutSubtree(root.id, currentX, 0);
    currentX += width + SUBTREE_PADDING * 2;
  }

  // Handle orphan nodes (not connected to hierarchy at all)
  const orphans = nodes.filter((n) => !positions.has(n.id));
  if (orphans.length > 0) {
    const maxY = Math.max(...Array.from(positions.values()).map((p) => p.y), 0);
    const orphanY = maxY + LEVEL_HEIGHT + 50;
    orphans.forEach((node, i) => {
      positions.set(node.id, { x: 100 + i * NODE_WIDTH_SPACING, y: orphanY });
    });
  }

  // Apply positions to nodes
  const positionedNodes = nodes.map((node) => {
    const pos = positions.get(node.id);
    return {
      ...node,
      position: pos ? { x: pos.x, y: pos.y } : node.position,
    };
  });

  return { nodes: positionedNodes, edges: mergedEdges };
}

/**
 * Apply layout algorithm to nodes
 * @param {Array} nodes - ReactFlow nodes
 * @param {Array} edges - ReactFlow edges
 * @param {string} layoutType - Layout algorithm type
 * @returns {Array} - Nodes with updated positions
 */
export function applyLayout(nodes, edges, layoutType) {
  switch (layoutType) {
    case LayoutTypes.HIERARCHICAL_TB:
      return hierarchicalLayout(nodes, edges, 'TB');
    case LayoutTypes.HIERARCHICAL_LR:
      return hierarchicalLayout(nodes, edges, 'LR');
    case LayoutTypes.FORCE_DIRECTED:
      return forceDirectedLayout(nodes, edges);
    case LayoutTypes.GRID:
      return gridLayout(nodes);
    case LayoutTypes.RADIAL:
      return radialLayout(nodes, edges);
    case LayoutTypes.CIDR_TREE:
      return cidrTreeLayout(nodes, edges).nodes;
    default:
      return nodes;
  }
}

/**
 * Apply CIDR tree layout and return both nodes and edges
 * This is useful when you want to also get the auto-generated edges
 * @param {Array} nodes - ReactFlow nodes
 * @param {Array} edges - ReactFlow edges
 * @returns {{ nodes: Array, edges: Array }}
 */
export function applyCIDRTreeLayout(nodes, edges) {
  return cidrTreeLayout(nodes, edges);
}
