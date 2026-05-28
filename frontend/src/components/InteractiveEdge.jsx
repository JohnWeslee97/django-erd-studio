import React from 'react';
import { getSmoothStepPath, BaseEdge, EdgeLabelRenderer } from 'reactflow';

/**
 * A custom ReactFlow edge with a wider invisible hit-area so users can
 * click relationship lines to inspect them.
 */
export default function InteractiveEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  data,
  style = {},
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const label = data?.label || '';
  const relatedName = data?.relatedName;

  const handleClick = (e) => {
    e.stopPropagation();
    if (data?.onEdgeClick) {
      data.onEdgeClick(id, { x: e.clientX, y: e.clientY });
    }
  };

  return (
    <>
      {/* Visible edge */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {/* Wider invisible click target */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={24}
        stroke="transparent"
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
      />

      {/* Label + related_name rendered via EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        <div
          onClick={handleClick}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          {label && (
            <span
              style={{
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                border: '1px solid #374151',
              }}
            >
              {label}
            </span>
          )}
          {relatedName && (
            <span
              style={{
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                padding: '1px 6px',
                borderRadius: '3px',
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                border: '1px solid #334155',
              }}
            >
              ↩ {relatedName}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
