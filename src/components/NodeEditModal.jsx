import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faSave,
  faNetworkWired,
  faServer,
  faDesktop,
  faGear,
  faTag,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import './NodeEditModal.css';

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

const serverSubTypes = [
  { value: 'web', label: 'Web Server' },
  { value: 'database', label: 'Database Server' },
  { value: 'dc', label: 'Domain Controller' },
  { value: 'file', label: 'File Server' },
  { value: 'mail', label: 'Mail Server' },
  { value: 'other', label: 'Other' },
];

const deviceSubTypes = [
  { value: 'router', label: 'Router' },
  { value: 'switch', label: 'Switch' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'ids_ips', label: 'IDS/IPS' },
  { value: 'waf', label: 'WAF' },
  { value: 'other', label: 'Other' },
];

const tagCategories = [
  { key: 'os', label: 'Operating System' },
  { key: 'domain', label: 'Domain Status' },
  { key: 'service', label: 'Services' },
  { key: 'risk', label: 'Risk Level' },
  { key: 'custom', label: 'Custom Tags' },
];

export const NodeEditModal = ({ node, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    ip: '',
    subType: '',
    tags: {},
  });
  const [newTag, setNewTag] = useState({ category: 'custom', value: '' });

  useEffect(() => {
    if (node) {
      setFormData({
        label: node.data.label || '',
        description: node.data.description || '',
        ip: node.data.ip || '',
        subType: node.data.subType || '',
        tags: { ...node.data.tags } || {},
      });
    }
  }, [node]);

  if (!node) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (!newTag.value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      tags: {
        ...prev.tags,
        [newTag.category]: [
          ...(prev.tags[newTag.category] || []),
          newTag.value.trim(),
        ],
      },
    }));
    setNewTag({ ...newTag, value: '' });
  };

  const handleRemoveTag = (category, tagValue) => {
    setFormData((prev) => ({
      ...prev,
      tags: {
        ...prev.tags,
        [category]: (prev.tags[category] || []).filter((t) => t !== tagValue),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedTags = Object.fromEntries(
      Object.entries(formData.tags).filter(
        ([, values]) => values && values.length > 0
      )
    );
    onSave({
      ...node,
      data: {
        ...node.data,
        ...formData,
        tags: cleanedTags,
      },
    });
    onClose();
  };

  const typeIcon = nodeTypeIcons[node.type] || faGear;
  const typeLabel = nodeTypeLabels[node.type] || 'Node';
  const showSubType = node.type === 'server' || node.type === 'device';
  const subTypeOptions = node.type === 'server' ? serverSubTypes : deviceSubTypes;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FontAwesomeIcon icon={typeIcon} className="title-icon" />
            <span>Edit {typeLabel}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="label">Label</label>
              <input
                id="label"
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                placeholder="Node label"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ip">IP Address / CIDR</label>
                <input
                  id="ip"
                  type="text"
                  value={formData.ip}
                  onChange={(e) => handleInputChange('ip', e.target.value)}
                  placeholder="192.168.1.0/24"
                />
              </div>

              {showSubType && (
                <div className="form-group">
                  <label htmlFor="subType">Sub Type</label>
                  <select
                    id="subType"
                    value={formData.subType}
                    onChange={(e) => handleInputChange('subType', e.target.value)}
                  >
                    <option value="">Select type...</option>
                    {subTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faTag} /> Tags
              </label>
              <div className="tags-display">
                {Object.entries(formData.tags).map(([category, values]) =>
                  values.map((tagValue) => (
                    <span
                      key={`${category}-${tagValue}`}
                      className={`tag-item tag-${category}`}
                    >
                      <span>{tagValue}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(category, tagValue)}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="tag-input-row">
                <select
                  value={newTag.category}
                  onChange={(e) =>
                    setNewTag({ ...newTag, category: e.target.value })
                  }
                >
                  {tagCategories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newTag.value}
                  onChange={(e) =>
                    setNewTag({ ...newTag, value: e.target.value })
                  }
                  placeholder="Tag value"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button type="button" onClick={handleAddTag} className="add-tag-btn">
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <FontAwesomeIcon icon={faSave} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
