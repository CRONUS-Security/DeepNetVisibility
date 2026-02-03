import React, { useState } from 'react';
import { NodeTypes, ServerSubTypes, DeviceSubTypes, createNode } from '../types/index.js';
import './ControlPanel.css';

export const ControlPanel = ({ onFitView, nodes = [], onAddNode, onClearAll }) => {
  const [showAddNode, setShowAddNode] = useState(false);
  const [nodeType, setNodeType] = useState(NodeTypes.SERVER);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeIP, setNodeIP] = useState('');
  const [subType, setSubType] = useState('');

  const getSubTypeOptions = () => {
    if (nodeType === NodeTypes.SERVER) {
      return Object.entries(ServerSubTypes).map(([key, value]) => ({
        label: key.replace(/_/g, ' '),
        value,
      }));
    }
    if (nodeType === NodeTypes.NETWORK_DEVICE) {
      return Object.entries(DeviceSubTypes).map(([key, value]) => ({
        label: key.replace(/_/g, ' '),
        value,
      }));
    }
    return [];
  };

  const handleAddNode = () => {
    if (!nodeLabel.trim()) {
      alert('Please enter a node label');
      return;
    }

    const newId = `${nodeType}-${Date.now()}`;
    const newNode = createNode(newId, nodeType, {
      label: nodeLabel,
      ip: nodeIP,
      subType: subType || null,
      position: {
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
      },
    });

    if (onAddNode) {
      onAddNode(newNode);
    }

    setNodeLabel('');
    setNodeIP('');
    setSubType('');
    setShowAddNode(false);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        `This will delete all ${nodes.length} nodes and their connections. Are you sure?`
      )
    ) {
      if (onClearAll) {
        onClearAll();
      }
    }
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h3>Controls</h3>
        <button className="btn-close" onClick={() => setShowAddNode(false)}>
          ×
        </button>
      </div>

      {!showAddNode ? (
        <div className="panel-buttons">
          <button className="btn btn-add-node" onClick={() => setShowAddNode(true)}>
            ➕ Add Node
          </button>
          <button className="btn btn-fit" onClick={onFitView}>
            🎯 Fit View
          </button>
          <button className="btn btn-clear" onClick={handleClearAll}>
            🗑️ Clear All
          </button>
        </div>
      ) : (
        <div className="add-node-form">
          <div className="form-group">
            <label>Node Type</label>
            <select
              value={nodeType}
              onChange={(e) => {
                setNodeType(e.target.value);
                setSubType('');
              }}
            >
              <option value={NodeTypes.CIDR}>CIDR Network</option>
              <option value={NodeTypes.SERVER}>Server</option>
              <option value={NodeTypes.PERSONAL_COMPUTER}>Personal Computer</option>
              <option value={NodeTypes.NETWORK_DEVICE}>Network Device</option>
            </select>
          </div>

          {getSubTypeOptions().length > 0 && (
            <div className="form-group">
              <label>Sub Type</label>
              <select value={subType} onChange={(e) => setSubType(e.target.value)}>
                <option value="">Select...</option>
                {getSubTypeOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Label</label>
            <input
              type="text"
              placeholder="e.g., DC01, WEB-Server"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNode()}
            />
          </div>

          <div className="form-group">
            <label>IP Address (Optional)</label>
            <input
              type="text"
              placeholder="e.g., 192.168.1.10"
              value={nodeIP}
              onChange={(e) => setNodeIP(e.target.value)}
            />
          </div>

          <div className="form-buttons">
            <button className="btn btn-add" onClick={handleAddNode}>
              Add
            </button>
            <button className="btn btn-cancel" onClick={() => setShowAddNode(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
