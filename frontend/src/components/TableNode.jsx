import React from 'react';
import { Handle, Position } from 'reactflow';

// Curated aesthetic color mapping for known Django applications to ensure 100% collision-free styling
const curatedAppColors = {
  academy: '#8b5cf6',   // Deep Purple
  blog: '#10b981',      // Emerald Green
  ecommerce: '#3b82f6', // Royal Blue
  support: '#ec4899',   // Magenta/Pink
  marketing: '#f59e0b', // Vibrant Amber
  analytics: '#06b6d4', // Bright Cyan
  inventory: '#f97316', // Bright Orange
  hr: '#14b8a6',        // Clean Teal
};

// Fallback color palette (12 distinct colors) if a user creates new custom apps in the future
const appColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ef4444', // red
  '#6366f1', // indigo
  '#84cc16', // lime
  '#059669', // dark green
];

const getAppColor = (appName) => {
  if (!appName) return '#6b7280';
  const lowerName = appName.toLowerCase();
  
  // Use custom curated color map if available
  if (curatedAppColors[lowerName]) {
    return curatedAppColors[lowerName];
  }
  
  // Deterministic fallback hashing if it's a dynamic user-created app
  let hash = 0;
  for (let i = 0; i < lowerName.length; i++) {
    hash = lowerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return appColors[Math.abs(hash) % appColors.length];
};

export default function TableNode({ data }) {
  const { name, app, fields = [], isDraft, isEditMode } = data;
  const headerColor = getAppColor(app || name);

  const containerStyle = {
    backgroundColor: '#1f2937',
    borderRadius: '10px',
    boxShadow: isDraft
      ? `0 0 0 2px ${headerColor}, 0 10px 15px -3px rgba(0, 0, 0, 0.4)`
      : '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    border: isDraft ? `2px dashed ${headerColor}` : `1px solid #374151`,
    width: '280px',
    fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
    color: '#f3f4f6',
    overflow: 'visible', // Prevent relationship handles (PK/FK circles) from being cropped
    transition: 'all 0.3s ease'
  };

  const headerStyle = {
    backgroundColor: headerColor,
    borderTopLeftRadius: '9px',
    borderTopRightRadius: '9px',
    color: '#ffffff',
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
  };

  const badgeStyle = (bgColor, textColor) => ({
    fontSize: '9px',
    backgroundColor: bgColor,
    color: textColor,
    padding: '2px 6px',
    borderRadius: '12px',
    fontWeight: '700',
    marginRight: '6px',
    display: 'inline-block',
    textTransform: 'uppercase'
  });

  const bodyStyle = {
    padding: '8px 0',
    borderBottomLeftRadius: '9px',
    borderBottomRightRadius: '9px',
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 14px',
    fontSize: '13px',
    borderBottom: '1px solid #374151',
    position: 'relative',
  };

  return (
    <div style={containerStyle}>

      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>{name}</span>
          {isDraft && (
            <span style={{
              fontSize: '9px',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '1px 5px',
              borderRadius: '4px',
              fontWeight: '800'
            }}>
              DRAFT
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isDraft ? (
            isEditMode && (
              <button
                onClick={(e) => { e.stopPropagation(); data.onPushToCode && data.onPushToCode(data.id); }}
                title="Push to Code"
                style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                PUSH
              </button>
            )
          ) : (
            <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
              {app}
            </span>
          )}
          {isEditMode === true && (
            <button
              onClick={(e) => { e.stopPropagation(); data.onDelete && data.onDelete(data.id); }}
              title={isDraft ? "Remove Draft" : "Delete Model Permanently"}
              style={{
                background: 'transparent',
                color: isDraft ? '#ef4444' : 'rgba(255,255,255,0.6)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px',
                marginLeft: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="nodrag table-fields-scroll" style={bodyStyle}>
        {fields.map((field, idx) => {
          const isPK = field.primary_key || field.pk;
          const relatedModel = field.related_model || field.related;
          const isFK = !!relatedModel && field.type === 'ForeignKey';
          const isO2O = field.type === 'OneToOneField';
          const isM2M = field.type === 'ManyToManyField';

          let displayType = field.type;
          if (isFK) displayType = `FK -> ${relatedModel.split('.').pop()}`;
          else if (isO2O) displayType = `O2O -> ${relatedModel.split('.').pop()}`;
          else if (isM2M) displayType = `M2M -> ${relatedModel.split('.').pop()}`;

          const isLast = idx === fields.length - 1;

          return (
            <div key={idx} style={{ ...rowStyle, borderBottom: isLast ? 'none' : '1px solid #374151' }}>
              {(isFK || isO2O || isM2M) && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={field.name}
                  style={{
                    background: isFK ? '#3b82f6' : isO2O ? '#10b981' : '#c084fc',
                    width: '8px',
                    height: '8px',
                    border: '2px solid #1f2937',
                    position: 'absolute',
                    left: '-4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'center' }}>
                {isPK && <span style={badgeStyle('#fbbf24', '#78350f')}>PK</span>}
                {isFK && <span style={badgeStyle('#3b82f6', '#ffffff')}>FK</span>}
                {isO2O && <span style={badgeStyle('#10b981', '#ffffff')}>O2O</span>}
                {isM2M && <span style={badgeStyle('#c084fc', '#ffffff')}>M2M</span>}
                <span style={{ fontWeight: isPK ? '600' : '400', color: isPK ? '#ffffff' : '#e5e7eb' }}>
                  {field.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
                <span style={{ fontStyle: 'italic', fontSize: '12px' }}>
                  {displayType}
                  {field.max_length && <span style={{ opacity: 0.6, marginLeft: '4px' }}>({field.max_length})</span>}
                </span>
              </div>

              {isPK && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={field.name}
                  style={{
                    background: '#fbbf24',
                    width: '8px',
                    height: '8px',
                    border: '2px solid #1f2937',
                    position: 'absolute',
                    right: '-4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
