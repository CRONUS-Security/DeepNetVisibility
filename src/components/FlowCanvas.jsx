import React, { useCallback, useEffect, useState } from 'react';
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
import { ImportExport } from './ImportExport';
import { ControlPanel } from './ControlPanel';

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
  const { fitView } = useReactFlow();

  // One-time initialization from store
  useEffect(() => {
    if (!isInitialized && initialNodes.length > 0) {
      setNodesState(initialNodes);
      setEdgesState(initialEdges);
      setIsInitialized(true);
    }
  }, [isInitialized]);

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
    fitView({ duration: 400 });
  }, [fitView]);

  const handleAddNode = useCallback(
    (newNode) => {
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

  return (
    <div className="flow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap position="bottom-left" />
      </ReactFlow>

      <div className="canvas-overlays">
        <ImportExport onImport={handleImport} onExport={handleExport} />
        <ControlPanel
          onFitView={handleFitView}
          nodes={nodes}
          onAddNode={handleAddNode}
          onClearAll={handleClearAll}
        />
      </div>
    </div>
  );
};
