import React, { useState, useEffect, useRef, useMemo } from 'react';
import ERDiagram from './components/ERDiagram';
import Toolbar from './components/Toolbar';
import ToastContainer from './components/Toast';
import StatsPanel from './components/StatsPanel';

const SYSTEM_APPS = ['auth', 'contenttypes', 'admin', 'sessions', 'messages', 'staticfiles', 'django_erd_studio'];

export default function App() {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [layoutDirection, setLayoutDirection] = useState(() => {
    return localStorage.getItem('erd_layout_direction') || 'LR';
  });
  const diagramRef = useRef(null);

  // Filter models based on system apps
  const filteredSchema = useMemo(() => {
    if (!schema) return null;
    
    return Object.fromEntries(
      Object.entries(schema).filter(([id, model]) => !SYSTEM_APPS.includes(model.app_label))
    );
  }, [schema]);

  const handleLayoutDirectionChange = (newDirection) => {
    setLayoutDirection(newDirection);
    localStorage.setItem('erd_layout_direction', newDirection);
    // Explicitly request auto-layout in the new direction
    diagramRef.current?.autoLayout(newDirection);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schemaRes = await fetch('/api/schema');
        if (!schemaRes.ok) throw new Error(`Schema API error! status: ${schemaRes.status}`);

        const schemaData = await schemaRes.json();
        if (schemaData.error) throw new Error(schemaData.error);
        
        setSchema(schemaData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addToast = (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    setToasts(t => [...t, { ...toast, id }]);
  };

  const dismissToast = (id) => {
    setToasts(t => t.filter(toast => toast.id !== id));
  };

  const appStyle = {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-background-primary)'
  };

  const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px'
  };

  if (loading) {
    return (
      <div style={appStyle}>
        <div style={centerStyle}>
          <div style={{
            width: '44px', height: '44px', border: '4px solid var(--color-border-secondary)',
            borderTopColor: 'green', borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ color: 'var(--color-text-secondary)' }}>loading your models...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={appStyle}>
        <div style={centerStyle}>
          <h2 style={{ color: '#ef4444' }}>Failed to load schema</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const modelCount = filteredSchema ? Object.keys(filteredSchema).length : 0;

  return (
    <div style={appStyle}>
      <Toolbar 
        modelCount={modelCount}
        loading={loading}
        onFitView={() => diagramRef.current?.fitView()}
        onAutoLayout={() => diagramRef.current?.autoLayout(layoutDirection)}
        onExportPNG={() => diagramRef.current?.exportPNG()}
        onExportPDF={() => diagramRef.current?.exportPDF()}
        onSearch={(term) => diagramRef.current?.search(term)}
        onToggleStats={() => setIsStatsOpen(!isStatsOpen)}
        layoutDirection={layoutDirection}
        onLayoutDirectionChange={handleLayoutDirectionChange}
      />

      <div style={{ flex: 1, width: '100%', position: 'relative' }}>
        <ERDiagram 
          schema={filteredSchema} 
          ref={diagramRef} 
          onToast={addToast}
          layoutDirection={layoutDirection}
        />
        <StatsPanel 
          schema={filteredSchema} 
          isOpen={isStatsOpen} 
          onClose={() => setIsStatsOpen(false)} 
        />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
