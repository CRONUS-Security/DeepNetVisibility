import React from 'react';
import { Handle, Position } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import './NodeStyles.css';

export const CIDRNode = ({ data, selected }) => {
  return (
    <div className={`node cidr-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">
          <FontAwesomeIcon icon={faNetworkWired} />
        </span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
        {data.ip && (
          <div className="node-info">
            <FontAwesomeIcon icon={faLocationDot} />
            <span>{data.ip}</span>
          </div>
        )}
      </div>
      {data.tags && Object.keys(data.tags).length > 0 && (
        <div className="node-tags">
          {Object.entries(data.tags).map(([category, values]) =>
            values.map((tag) => (
              <span key={`${category}-${tag}`} className={`tag tag-${category}`}>
                {tag}
              </span>
            ))
          )}
        </div>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
