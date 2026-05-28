import React from 'react';

export default function StatsPanel({ schema, isOpen, onClose }) {
  if (!isOpen) return null;

  const stats = Object.values(schema).reduce((acc, model) => {
    acc.totalModels += 1;
    const app = model.app_label || model.app || 'unknown';
    acc.uniqueApps.add(app);
    model.fields.forEach(f => {
      acc.totalFields += 1;
      acc.fieldTypes[f.type] = (acc.fieldTypes[f.type] || 0) + 1;
      if (f.type === 'ForeignKey' || f.type === 'OneToOneField' || f.type === 'ManyToManyField') {
        acc.totalRelationships += 1;
      }
    });
    return acc;
  }, { totalModels: 0, totalFields: 0, totalRelationships: 0, fieldTypes: {}, uniqueApps: new Set() });

  const panelStyle = {
    position: 'fixed',
    right: 0,
    top: '48px', // below toolbar
    bottom: 0,
    width: '320px',
    backgroundColor: '#1e293b',
    borderLeft: '1px solid #334155',
    boxShadow: '-4px 0 15px rgba(0,0,0,0.3)',
    zIndex: 100,
    color: '#f1f5f9',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Inter", system-ui, sans-serif',
    transition: 'transform 0.3s ease-in-out',
  };

  const statCardStyle = {
    backgroundColor: '#0f172a',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #334155'
  };

  const labelStyle = {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px'
  };

  const valueStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#38bdf8'
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Schema Statistics</h2>
        <button 
           onClick={onClose}
           style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}
        >
          ✕
        </button>
      </div>

      <div style={statCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={labelStyle}>Total Models</div>
            <div style={valueStyle}>{stats.totalModels}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={labelStyle}>Unique Apps</div>
            <div style={{ ...valueStyle, color: '#10b981' }}>{stats.uniqueApps.size}</div>
          </div>
        </div>
      </div>

      <div style={{ ...statCardStyle, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={labelStyle}>Fields</div>
            <div style={{ ...valueStyle, fontSize: '18px' }}>{stats.totalFields}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={labelStyle}>Relations</div>
            <div style={{ ...valueStyle, fontSize: '18px', color: '#a78bfa' }}>{stats.totalRelationships}</div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Field Breakdown</h3>
      <div className="stats-scroll-area" style={{ 
        flex: 1, 
        overflowY: 'auto',
        paddingRight: '12px',
        marginRight: '-4px'
      }}>
        <style>{`
          .stats-scroll-area::-webkit-scrollbar {
            width: 6px;
          }
          .stats-scroll-area::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }
          .stats-scroll-area::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 10px;
          }
          .stats-scroll-area::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
        `}</style>
        {Object.entries(stats.fieldTypes)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <div key={type} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '10px 0', 
              borderBottom: '1px solid rgba(51, 65, 85, 0.5)' 
            }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{type}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#38bdf8' }}>{count}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
