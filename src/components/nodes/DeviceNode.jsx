import React from 'react';
import { Handle, Position } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRoute,
  faShuffle,
  faShieldHalved,
  faShield,
  faGear,
  faLocationDot,
  faSkull,
} from '@fortawesome/free-solid-svg-icons';
import './NodeStyles.css';

const deviceIcons = {
  router: faRoute,
  switch: faShuffle,
  firewall: faShieldHalved,
  ids_ips: faShield,
  waf: faShield,
  other: faGear,
};

export const DeviceNode = ({ data, selected }) => {
  const icon = deviceIcons[data.subType] || deviceIcons.other;

  return (
    <div className={`node device-node ${selected ? 'selected' : ''} ${data.pwned ? 'pwned' : ''}`}>
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
      {data.pwned && (
        <div className="pwned-indicator" title="Pwned">
          <FontAwesomeIcon icon={faSkull} />
        </div>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
