import React, { useRef, useMemo } from 'react';
import './ImportExport.css';

export const ImportExport = ({ onImport, onExport }) => {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const { nodes, edges } = onExport();
    const jsonData = JSON.stringify(
      {
        version: '1.0',
        timestamp: new Date().toISOString(),
        nodes,
        edges,
      },
      null,
      2
    );
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-map-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error('Invalid JSON: missing nodes array');
      }

      if (!parsed.edges || !Array.isArray(parsed.edges)) {
        throw new Error('Invalid JSON: missing edges array');
      }

      onImport(parsed.nodes, parsed.edges);
      alert(`✓ Import successful!\nLoaded ${parsed.nodes.length} nodes and ${parsed.edges.length} edges`);
    } catch (error) {
      alert(`✗ Import failed!\n${error.message}`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculate stats from current state
  const { nodes, edges } = onExport();
  const nodesByType = useMemo(() => {
    const counts = {};
    nodes.forEach((node) => {
      counts[node.type] = (counts[node.type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const stats = useMemo(
    () => ({
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType,
    }),
    [nodes.length, edges.length, nodesByType]
  );

  return (
    <div className="import-export-panel">
      <div className="panel-header">
        <h3>Import / Export</h3>
      </div>

      <div className="panel-content">
        <div className="stats-section">
          <div className="stat-item">
            <span className="stat-label">Total Nodes:</span>
            <span className="stat-value">{stats.totalNodes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Edges:</span>
            <span className="stat-value">{stats.totalEdges}</span>
          </div>
        </div>

        <div className="node-types-stats">
          {Object.entries(stats.nodesByType || {}).map(([type, count]) => (
            <div key={type} className="type-stat">
              <span>{type}:</span>
              <span className="count">{count}</span>
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="btn btn-export" onClick={handleExport}>
            📥 Export to JSON
          </button>
          <button className="btn btn-import" onClick={handleImportClick}>
            📤 Import from JSON
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="panel-footer">
        <small>Supports JSON format v1.0</small>
      </div>
    </div>
  );
};
