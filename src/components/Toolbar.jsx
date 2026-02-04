import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNetworkWired,
  faFolder,
  faFileExport,
  faFileImport,
  faTrash,
  faPlus,
  faServer,
  faDesktop,
  faGear,
  faCrosshairs,
  faCubes,
  faLink,
  faChevronDown,
  faSitemap,
  faProjectDiagram,
  faTableCells,
  faCircleNodes,
  faArrowsUpDown,
  faArrowsLeftRight,
  faDiagramProject,
} from '@fortawesome/free-solid-svg-icons';
import { LayoutTypes, LayoutLabels } from '../utils/layoutAlgorithms';
import './Toolbar.css';

export const Toolbar = ({
  onExport,
  onImport,
  onAddNode,
  onFitView,
  onClearAll,
  onApplyLayout,
  stats,
}) => {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const fileInputRef = useRef(null);
  const fileMenuRef = useRef(null);
  const addMenuRef = useRef(null);
  const layoutMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
        setShowFileMenu(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target)) {
        setShowLayoutMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showFileMenu || showAddMenu || showLayoutMenu) {
          event.preventDefault();
          event.stopPropagation();
          setShowFileMenu(false);
          setShowAddMenu(false);
          setShowLayoutMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFileMenu, showAddMenu, showLayoutMenu]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.nodes && data.edges) {
        onImport(data.nodes, data.edges);
      } else {
        alert('Invalid file format: missing nodes or edges');
      }
    } catch (error) {
      alert('Failed to parse JSON file');
    }
    event.target.value = '';
  };

  const handleExportClick = () => {
    const data = onExport();
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      ...data,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-map-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setShowFileMenu(false);
  };

  const handleClearClick = () => {
    if (window.confirm('Are you sure you want to clear all nodes and edges?')) {
      onClearAll();
    }
    setShowFileMenu(false);
  };

  const handleAddNodeClick = (type) => {
    onAddNode(type);
    setShowAddMenu(false);
  };

  const handleLayoutClick = (layoutType) => {
    onApplyLayout(layoutType);
    setShowLayoutMenu(false);
  };

  const layoutIcons = {
    [LayoutTypes.HIERARCHICAL_TB]: faArrowsUpDown,
    [LayoutTypes.HIERARCHICAL_LR]: faArrowsLeftRight,
    [LayoutTypes.FORCE_DIRECTED]: faProjectDiagram,
    [LayoutTypes.GRID]: faTableCells,
    [LayoutTypes.RADIAL]: faCircleNodes,
    [LayoutTypes.CIDR_TREE]: faDiagramProject,
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-brand">
          <FontAwesomeIcon icon={faNetworkWired} className="brand-icon" />
          <span className="brand-text">DeepNetVisibility</span>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="toolbar-menu" ref={fileMenuRef}>
          <button
            className={`toolbar-btn ${showFileMenu ? 'active' : ''}`}
            onClick={() => {
              setShowFileMenu(!showFileMenu);
              setShowAddMenu(false);
              setShowLayoutMenu(false);
            }}
          >
            <FontAwesomeIcon icon={faFolder} />
            <span>File</span>
            <FontAwesomeIcon icon={faChevronDown} className="chevron" />
          </button>
          {showFileMenu && (
            <div className="dropdown-menu">
              <button onClick={handleImportClick}>
                <FontAwesomeIcon icon={faFileImport} />
                <span>Import JSON</span>
                <kbd>Ctrl+O</kbd>
              </button>
              <button onClick={handleExportClick}>
                <FontAwesomeIcon icon={faFileExport} />
                <span>Export JSON</span>
                <kbd>Ctrl+S</kbd>
              </button>
              <div className="menu-divider" />
              <button className="danger" onClick={handleClearClick}>
                <FontAwesomeIcon icon={faTrash} />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-menu" ref={addMenuRef}>
          <button
            className={`toolbar-btn ${showAddMenu ? 'active' : ''}`}
            onClick={() => {
              setShowAddMenu(!showAddMenu);
              setShowFileMenu(false);
              setShowLayoutMenu(false);
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add</span>
            <FontAwesomeIcon icon={faChevronDown} className="chevron" />
          </button>
          {showAddMenu && (
            <div className="dropdown-menu">
              <button onClick={() => handleAddNodeClick('cidr')}>
                <FontAwesomeIcon icon={faNetworkWired} />
                <span>CIDR Network</span>
              </button>
              <button onClick={() => handleAddNodeClick('server')}>
                <FontAwesomeIcon icon={faServer} />
                <span>Server</span>
              </button>
              <button onClick={() => handleAddNodeClick('pc')}>
                <FontAwesomeIcon icon={faDesktop} />
                <span>Personal Computer</span>
              </button>
              <button onClick={() => handleAddNodeClick('device')}>
                <FontAwesomeIcon icon={faGear} />
                <span>Network Device</span>
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-menu" ref={layoutMenuRef}>
          <button
            className={`toolbar-btn ${showLayoutMenu ? 'active' : ''}`}
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowFileMenu(false);
              setShowAddMenu(false);
            }}
          >
            <FontAwesomeIcon icon={faSitemap} />
            <span>Layout</span>
            <FontAwesomeIcon icon={faChevronDown} className="chevron" />
          </button>
          {showLayoutMenu && (
            <div className="dropdown-menu">
              {Object.entries(LayoutTypes).map(([key, value]) => (
                <button key={key} onClick={() => handleLayoutClick(value)}>
                  <FontAwesomeIcon icon={layoutIcons[value]} />
                  <span>{LayoutLabels[value]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="toolbar-btn" onClick={onFitView}>
          <FontAwesomeIcon icon={faCrosshairs} />
          <span>Fit View</span>
        </button>
      </div>

      <div className="toolbar-right">
        <div className="toolbar-stats">
          <span className="stat">
            <FontAwesomeIcon icon={faCubes} />
            <span>{stats?.totalNodes || 0}</span>
          </span>
          <span className="stat">
            <FontAwesomeIcon icon={faLink} />
            <span>{stats?.totalEdges || 0}</span>
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
};
