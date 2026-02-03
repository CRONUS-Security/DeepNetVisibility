import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useFlowStore } from '../store/useFlowStore';
import { NodeTypes } from '../types/index';
import { CIDRNode } from './nodes/CIDRNode';
import { ServerNode } from './nodes/ServerNode';
import { PCNode } from './nodes/PCNode';
import { DeviceNode } from './nodes/DeviceNode';
import { Toolbar } from './Toolbar';
import { ContextMenu } from './ContextMenu';
import { NodeEditModal } from './NodeEditModal';
import { applyLayout } from '../utils/layoutAlgorithms';

import './FlowCanvas.css';

const nodeTypes = {
  [NodeTypes.CIDR]: CIDRNode,
  [NodeTypes.SERVER]: ServerNode,
  [NodeTypes.PERSONAL_COMPUTER]: PCNode,
  [NodeTypes.NETWORK_DEVICE]: DeviceNode,
};

export const FlowCanvas = () => {
  const { nodes: initialNodes, edges: initialEdges } = useFlowStore();
  const [nodes, setNodesState, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState(initialEdges);
  const [isInitialized, setIsInitialized] = useState(false);
  const { fitView, setCenter } = useReactFlow();

  const [contextMenu, setContextMenu] = useState(null);
  const [editingNode, setEditingNode] = useState(null);

  useEffect(() => {
    if (!isInitialized && initialNodes.length > 0) {
      setNodesState(initialNodes);
      setEdgesState(initialEdges);
      setIsInitialized(true);
    }
  }, [isInitialized, initialNodes, initialEdges, setNodesState, setEdgesState]);

  const stats = useMemo(() => ({
    totalNodes: nodes.length,
    totalEdges: edges.length,
  }), [nodes.length, edges.length]);

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleConnect = useCallback(
    (connection) => {
      const newEdges = addEdge(connection, edges);
      setEdgesState(newEdges);
    },
    [edges, setEdgesState]
  );

  const handleFitView = useCallback(() => {
    fitView({ duration: 400, padding: 0.2 });
  }, [fitView]);

  const handleAddNode = useCallback(
    (type) => {
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          description: '',
          ip: '',
          subType: type === 'server' ? 'other' : type === 'device' ? 'other' : null,
          tags: {},
        },
      };
      setNodesState((nds) => [...nds, newNode]);
    },
    [setNodesState]
  );

  const handleClearAll = useCallback(() => {
    setNodesState([]);
    setEdgesState([]);
  }, [setNodesState, setEdgesState]);

  const handleImport = useCallback(
    (importedNodes, importedEdges) => {
      setNodesState(importedNodes);
      setEdgesState(importedEdges);
    },
    [setNodesState, setEdgesState]
  );

  const handleExport = useCallback(() => {
    return { nodes, edges };
  }, [nodes, edges]);

  const handleNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  }, []);

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleEditNode = useCallback((node) => {
    setEditingNode(node);
  }, []);

  const handleSaveNode = useCallback(
    (updatedNode) => {
      setNodesState((nds) =>
        nds.map((n) => (n.id === updatedNode.id ? updatedNode : n))
      );
    },
    [setNodesState]
  );

  const handleDuplicateNode = useCallback(
    (node) => {
      const newNode = {
        ...node,
        id: `${node.type}-${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: { ...node.data },
      };
      setNodesState((nds) => [...nds, newNode]);
    },
    [setNodesState]
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodesState((nds) => nds.filter((n) => n.id !== nodeId));
      setEdgesState((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [setNodesState, setEdgesState]
  );

  const handleFocusNode = useCallback(
    (node) => {
      setCenter(node.position.x + 100, node.position.y + 50, {
        zoom: 1.5,
        duration: 500,
      });
    },
    [setCenter]
  );

  const handleApplyLayout = useCallback(
    (layoutType) => {
      const newNodes = applyLayout(nodes, edges, layoutType);
      setNodesState(newNodes);
      setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
    },
    [nodes, edges, setNodesState, fitView]
  );

  return (
    <div className="flow-container">
      <Toolbar
        onExport={handleExport}
        onImport={handleImport}
        onAddNode={handleAddNode}
        onFitView={handleFitView}
        onClearAll={handleClearAll}
        onApplyLayout={handleApplyLayout}
        stats={stats}
      />

      <div className="flow-canvas-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          panOnScroll={false}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          minZoom={0.1}
          maxZoom={4}
          translateExtent={[
            [-Infinity, -Infinity],
            [Infinity, Infinity],
          ]}
          nodeExtent={[
            [-Infinity, -Infinity],
            [Infinity, Infinity],
          ]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
          }}
        >
          <Background
            variant="dots"
            gap={20}
            size={1}
            color="#21262d"
          />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-left"
            nodeColor={(node) => {
              switch (node.type) {
                case 'cidr':
                  return '#58a6ff';
                case 'server':
                  return '#ff8787';
                case 'pc':
                  return '#66b395';
                case 'device':
                  return '#d29922';
                default:
                  return '#30363d';
              }
            }}
            maskColor="rgba(13, 17, 23, 0.8)"
          />
        </ReactFlow>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onEdit={handleEditNode}
          onDuplicate={handleDuplicateNode}
          onDelete={handleDeleteNode}
          onFocus={handleFocusNode}
          onClose={handleCloseContextMenu}
        />
      )}

      {editingNode && (
        <NodeEditModal
          node={editingNode}
          onSave={handleSaveNode}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  );
};
