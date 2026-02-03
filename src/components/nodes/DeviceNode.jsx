import React from 'react';
import { Handle, Position } from 'reactflow';
import './NodeStyles.css';

const deviceIcons = {
  router: '🔄',
  switch: '🔀',
  firewall: '🔥',
  ids_ips: '🛡️',
  waf: '🛡️',
  other: '⚙️',
};

export const DeviceNode = ({ data }) => {
  const icon = deviceIcons[data.subType] || deviceIcons.other;

  return (
    <div className="node device-node">
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
