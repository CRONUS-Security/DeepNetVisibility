import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPencil,
  faCopy,
  faTrash,
  faExpand,
  faNetworkWired,
  faServer,
  faDesktop,
  faGear,
  faSkull,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import './ContextMenu.css';

const nodeTypeIcons = {
  cidr: faNetworkWired,
  server: faServer,
  pc: faDesktop,
  device: faGear,
};

const nodeTypeLabels = {
  cidr: 'CIDR Network',
  server: 'Server',
  pc: 'Personal Computer',
  device: 'Network Device',
};

export const ContextMenu = ({
  x,
  y,
  node,
  onEdit,
  onDuplicate,
  onDelete,
  onFocus,
  onTogglePwned,
  onClose,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (key === 'escape') {
        onClose();
        return;
      }

      if (key === 'e') {
        event.preventDefault();
        onEdit(node);
        onClose();
        return;
      }

      if (key === 'd' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onDuplicate(node);
        onClose();
        return;
      }

      if (key === 'f') {
        event.preventDefault();
        onFocus(node);
        onClose();
        return;
      }

      if (key === 'p') {
        event.preventDefault();
        onTogglePwned(node);
        onClose();
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        onDelete(node.id);
        onClose();
        return;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [node, onClose, onEdit, onDuplicate, onFocus, onTogglePwned, onDelete]);

  if (!node) return null;

  const adjustedX = x + 200 > window.innerWidth ? x - 200 : x;
  const adjustedY = y + 280 > window.innerHeight ? y - 280 : y;

  const typeIcon = nodeTypeIcons[node.type] || faGear;
  const typeLabel = nodeTypeLabels[node.type] || 'Node';

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: adjustedX,
        top: adjustedY,
      }}
    >
      <div className="context-menu-header">
        <div className="node-type-badge">
          <FontAwesomeIcon icon={typeIcon} />
          <span>{typeLabel}</span>
        </div>
        <div className="node-label">{node.data.label}</div>
        {node.data.ip && <div className="node-ip">{node.data.ip}</div>}
      </div>

      <div className="context-menu-items">
        <button
          onClick={() => {
            onEdit(node);
            onClose();
          }}
        >
          <FontAwesomeIcon icon={faPencil} />
          <span>Edit Node</span>
          <kbd>E</kbd>
        </button>

        <button
          onClick={() => {
            onDuplicate(node);
            onClose();
          }}
        >
          <FontAwesomeIcon icon={faCopy} />
          <span>Duplicate</span>
          <kbd>Ctrl+D</kbd>
        </button>

        <button
          onClick={() => {
            onFocus(node);
            onClose();
          }}
        >
          <FontAwesomeIcon icon={faExpand} />
          <span>Focus on Node</span>
          <kbd>F</kbd>
        </button>

        <div className="menu-divider" />

        <button
          className={node.data?.pwned ? 'pwned-active' : 'pwned'}
          onClick={() => {
            onTogglePwned(node);
            onClose();
          }}
        >
          <FontAwesomeIcon icon={node.data?.pwned ? faShieldHalved : faSkull} />
          <span>{node.data?.pwned ? 'Mark as Secured' : 'Mark as Pwned'}</span>
          <kbd>P</kbd>
        </button>

        <div className="menu-divider" />

        <button
          className="danger"
          onClick={() => {
            onDelete(node.id);
            onClose();
          }}
        >
          <FontAwesomeIcon icon={faTrash} />
          <span>Delete</span>
          <kbd>Del</kbd>
        </button>
      </div>
    </div>
  );
};
