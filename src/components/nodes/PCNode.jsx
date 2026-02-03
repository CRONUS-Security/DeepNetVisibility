import React from 'react';
import { Handle, Position } from 'reactflow';
import './NodeStyles.css';

const osIcons = {
  windows: '🪟',
  linux: '🐧',
  macos: '🍎',
  other: '💻',
};

export const PCNode = ({ data }) => {
  const os = data.tags?.os?.[0] || 'other';
  const icon = osIcons[os] || osIcons.other;

  return (
    <div className="node pc-node">
      <div className="node-header">
        <span className="node-icon">{icon}</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        <div className="node-description">{data.description}</div>
        {data.ip && <div className="node-info">IP: {data.ip}</div>}
      </div>
      <div className="node-tags">
        {Object.entries(data.tags || {}).map(([category, values]) =>
          values.map((tag) => (
            <span key={`${category}-${tag}`} className={`tag tag-${category}`}>
              {tag}
            </span>
          ))
        )}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
