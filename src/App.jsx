import { ReactFlowProvider } from 'reactflow';
import { useEffect } from 'react';
import { useFlowStore } from './store/useFlowStore';
import { FlowCanvas } from './components/FlowCanvas';
import sampleData from './data/sampleData.json';
import './App.css';

function App() {
  const { importFromJSON } = useFlowStore();

  useEffect(() => {
    // Load sample data on mount
    importFromJSON(sampleData);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="app">
        <FlowCanvas />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
