import { create } from 'zustand';
import { createNode, createEdge } from '../types/index';

export const useFlowStore = create((set, get) => ({
  // State
  nodes: [],
  edges: [],
  selectedNodeId: null,

  // Actions
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  addNode: (nodeData) => {
    const newNode = createNode(nodeData.id, nodeData.type, nodeData);
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
  },

  updateNode: (nodeId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
      ),
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    }));
  },

  addEdge: (edgeData) => {
    const newEdge = createEdge(edgeData.source, edgeData.target, edgeData);
    set((state) => ({
      edges: [...state.edges, newEdge],
    }));
  },

  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));
  },

  // Import/Export operations
  exportToJSON: () => {
    const state = get();
    return JSON.stringify(
      {
        version: '1.0',
        timestamp: new Date().toISOString(),
        nodes: state.nodes,
        edges: state.edges,
      },
      null,
      2
    );
  },

  importFromJSON: (jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error('Invalid JSON: missing nodes array');
      }

      if (!parsed.edges || !Array.isArray(parsed.edges)) {
        throw new Error('Invalid JSON: missing edges array');
      }

      set({
        nodes: parsed.nodes,
        edges: parsed.edges,
      });

      return { success: true, message: `Imported ${parsed.nodes.length} nodes and ${parsed.edges.length} edges` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  clearAll: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
  },

  // Get statistics
  getStats: () => {
    const state = get();
    const nodesByType = {};

    state.nodes.forEach((node) => {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    });

    return {
      totalNodes: state.nodes.length,
      totalEdges: state.edges.length,
      nodesByType,
    };
  },
}));
