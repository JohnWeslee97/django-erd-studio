import React from 'react';

/**
 * Floating panel that appears when the user clicks a relationship edge.
 *
 * Props:
 *   info      – { x, y, sourceTable, targetTable, sourceField, relType, relatedName, stroke }
 *   onClose   – () => void
 */
export default function EdgeInfoPanel({ info, onClose }) {
  if (!info) return null;

  const relLabels = { '1:N': 'Many-to-One (FK)', '1:1': 'One-to-One', 'M:N': 'Many-to-Many' };

  return (
    <div
      style={{
        position: 'fixed',
        left: Math.min(info.x, window.innerWidth - 320),
        top: Math.min(info.y, window.innerHeight - 280),
        zIndex: 2000,
        minWidth: '280px',
        backgroundColor: '#111827',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '20px',
        color: '#f3f4f6',
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: '13px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        animation: 'fadeInScale 0.2s ease',
      }}
    >
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: info.stroke || '#3b82f6', display: 'inline-block'
          }} />
          Relationship
        </span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}
        >✕</button>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Row label="Type" value={relLabels[info.relType] || info.relType} />
        <Row label="Source Table" value={info.sourceTable} highlight />
        <Row label="Source Field" value={info.sourceField} mono />
        <Row label="Target Table" value={info.targetTable} highlight />
        <Row label="Target Field" value={info.targetField || info.sourceField} mono />
        {info.relatedName && <Row label="related_name" value={info.relatedName} mono />}
      </div>

      {/* Visual */}
      <div style={{
        marginTop: '16px',
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: '#1f2937',
        textAlign: 'center',
        fontSize: '12px',
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}>
        <span style={{ color: '#3b82f6', fontWeight: 600 }}>{info.sourceTable}</span>
        <span style={{ color: '#6b7280' }}>
          {info.relType === '1:N' ? '──▸ 1:N ──▸' :
           info.relType === '1:1' ? '──── 1:1 ────' :
           '◀── M:N ──▸'}
        </span>
        <span style={{ color: '#10b981', fontWeight: 600 }}>{info.targetTable}</span>
      </div>
    </div>
  );
}

function Row({ label, value, highlight, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{
        fontWeight: highlight ? 600 : 400,
        color: highlight ? '#60a5fa' : '#e5e7eb',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        fontSize: mono ? '12px' : '13px',
        backgroundColor: mono ? '#1f2937' : 'transparent',
        padding: mono ? '2px 6px' : 0,
        borderRadius: mono ? '4px' : 0,
      }}>
        {value}
      </span>
    </div>
  );
}
