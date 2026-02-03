import React from 'react';
import { Handle, Position } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlobe,
  faDatabase,
  faKey,
  faFolderOpen,
  faEnvelope,
  faServer,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import './NodeStyles.css';

const serverIcons = {
  web: faGlobe,
  database: faDatabase,
  dc: faKey,
  file: faFolderOpen,
  mail: faEnvelope,
  other: faServer,
};

export const ServerNode = ({ data, selected }) => {
  const icon = serverIcons[data.subType] || serverIcons.other;

  return (
    <div className={`node server-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">
          <FontAwesomeIcon icon={icon} />
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
