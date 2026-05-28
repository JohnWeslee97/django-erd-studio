import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  applyNodeChanges, 
  applyEdgeChanges,
  Panel,
  getNodesBounds
} from 'reactflow';
import 'reactflow/dist/style.css';

import { getLayoutedElements } from '../utils/layout';
import { generateGraphData } from '../utils/edges';
import { exportToPng, exportToPdf } from '../utils/export';
import TableNode from './TableNode';
import InteractiveEdge from './InteractiveEdge';
import EdgeInfoPanel from './EdgeInfoPanel';

const ERDiagram = forwardRef(({ schema, onToast }, ref) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [rfInstance, setRfInstance] = useState(null);
  const [edgeInfo, setEdgeInfo] = useState(null);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => {
    if (rfInstance) {
      rfInstance.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (rfInstance) {
      rfInstance.zoomOut({ duration: 300 });
    }
  };

  const onMove = (event, viewport) => {
    if (viewport && viewport.zoom !== undefined) {
      setZoom(Math.round(viewport.zoom * 100));
    }
  };

  // Memoize custom node and edge types
  const nodeTypes = useMemo(() => ({ tableNode: TableNode }), []);
  const edgeTypes = useMemo(() => ({ interactiveEdge: InteractiveEdge }), []);

  const handleEdgeClick = (edgeId, { x, y }) => {
    const edge = edges.find(e => e.id === edgeId);
    if (edge && edge.data) {
      setEdgeInfo({ ...edge.data, x, y });
    }
  };

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    fitView: () => {
      if (rfInstance) rfInstance.fitView({ padding: 0.2, duration: 800, minZoom: 0.1, maxZoom: 1.5 });
    },
    autoLayout: () => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements([...nodes], [...edges]);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      requestAnimationFrame(() => {
        setTimeout(() => rfInstance?.fitView({ padding: 0.15, duration: 600, minZoom: 0.1, maxZoom: 1.5 }), 100);
      });
    },
    search: (term) => {
      if (!term) return;
      const termLower = term.toLowerCase();
      const match = nodes.find(n => 
        n.data.name.toLowerCase().includes(termLower) || 
        n.data.app.toLowerCase().includes(termLower)
      );
      if (match && rfInstance) {
        rfInstance.setCenter(match.position.x + 140, match.position.y + 50, { zoom: 1.2, duration: 800 });
      }
    },
    exportPNG: async () => {
      if (!rfInstance) return;
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements([...nodes], [...edges]);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const bounds = getNodesBounds(layoutedNodes);
      const padding = 80;
      const width = bounds.width + padding * 2;
      const height = bounds.height + padding * 2;
      const x = -bounds.x + padding;
      const y = -bounds.y + padding;
      
      const viewportElement = document.querySelector('.react-flow__viewport');
      if (viewportElement) {
        await exportToPng(viewportElement, {
          width,
          height,
          style: {
            width: `${width}px`,
            height: `${height}px`,
            transform: `translate(${x}px, ${y}px) scale(1)`,
          }
        });
      }
      
      rfInstance.fitView({ padding: 0.15, duration: 600, minZoom: 0.1, maxZoom: 1.5 });
    },
    exportPDF: async () => {
      if (!rfInstance) return;
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements([...nodes], [...edges]);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const bounds = getNodesBounds(layoutedNodes);
      const padding = 80;
      const width = bounds.width + padding * 2;
      const height = bounds.height + padding * 2;
      const x = -bounds.x + padding;
      const y = -bounds.y + padding;
      
      const viewportElement = document.querySelector('.react-flow__viewport');
      if (viewportElement) {
        await exportToPdf(viewportElement, {
          width,
          height,
          style: {
            width: `${width}px`,
            height: `${height}px`,
            transform: `translate(${x}px, ${y}px) scale(1)`,
          }
        });
      }
      
      rfInstance.fitView({ padding: 0.15, duration: 600, minZoom: 0.1, maxZoom: 1.5 });
    }
  }));

  useEffect(() => {
    if (!schema) return;

    const { nodes: rawNodes, edges: rawEdges } = generateGraphData(schema);
    
    const enhancedNodes = rawNodes.map(n => ({
      ...n,
      data: { ...n.data, id: n.id }
    }));

    const enhancedEdges = rawEdges.map(e => ({
      ...e,
      data: { ...e.data, onEdgeClick: handleEdgeClick }
    }));

    const savedLayoutStr = localStorage.getItem('erd_layout_positions');
    let layoutedNodes = [];
    let layoutedEdges = enhancedEdges;

    if (savedLayoutStr) {
      try {
        const savedPositions = JSON.parse(savedLayoutStr);
        layoutedNodes = enhancedNodes.map(node => {
          if (savedPositions[node.id]) return { ...node, position: savedPositions[node.id] };
          return node;
        });
      } catch (e) {
        console.error("Failed to parse saved layout", e);
      }
    } else {
      layoutedNodes = [...enhancedNodes];
    }

    if (layoutedNodes.length === 0 || layoutedNodes.some(n => n.position.x === 0 && n.position.y === 0)) {
       const layoutResult = getLayoutedElements(layoutedNodes, layoutedEdges);
       layoutedNodes = layoutResult.nodes;
       layoutedEdges = layoutResult.edges;
    }
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    // Only fit view on first load or schema change
    if (!rfInstance?.getNodes().length) {
        setTimeout(() => {
          if (rfInstance) rfInstance.fitView({ padding: 0.2, duration: 800 });
        }, 200);
    }
  }, [schema, rfInstance]);

  const onNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };
  
  const onEdgesChange = (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  const onNodeDragStop = (event, node) => {
    const positions = {};
    nodes.forEach(n => {
      positions[n.id] = n.id === node.id ? node.position : n.position;
    });
    localStorage.setItem('erd_layout_positions', JSON.stringify(positions));
  };

  // Close panel on background click
  const onPaneClick = () => setEdgeInfo(null);

  if (!schema) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827', color: '#f3f4f6' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #374151', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2>Loading Django Schema...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#111827', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={(instance) => {
          setRfInstance(instance);
          setZoom(Math.round(instance.getZoom() * 100));
        }}
        onMove={onMove}
        deleteKeyCode={null}
        minZoom={0.05}
        maxZoom={2}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={16} size={1} />
        
        <Panel position="bottom-left" style={{ margin: '15px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '6px 12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            color: '#cbd5e1',
            fontFamily: '"Inter", sans-serif',
            userSelect: 'none'
          }}>
            <button
              onClick={handleZoomOut}
              style={{
                background: 'none',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => e.target.style.color = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.color = '#cbd5e1'}
            >
              —
            </button>
            <span style={{ fontSize: '13px', minWidth: '40px', textAlign: 'center', fontWeight: '600' }}>
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              style={{
                background: 'none',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => e.target.style.color = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.color = '#cbd5e1'}
            >
              +
            </button>
          </div>
        </Panel>

        {showMiniMap && (
          <MiniMap nodeColor="#374151" style={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} maskColor="rgba(0,0,0,0.4)" />
        )}
        <Panel position="bottom-right" style={{ marginBottom: showMiniMap ? '160px' : '10px', transition: 'margin 0.3s ease' }}>
          <button 
            onClick={() => setShowMiniMap(!showMiniMap)}
            style={{
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            {showMiniMap ? '🗺️ Hide Map' : '🗺️ Show Map'}
          </button>
        </Panel>
      </ReactFlow>

      <EdgeInfoPanel info={edgeInfo} onClose={() => setEdgeInfo(null)} />
    </div>
  );
});

export default ERDiagram;
