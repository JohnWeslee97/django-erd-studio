import React, { useState } from 'react';

export default function Toolbar({ 
  modelCount, 
  appName="django-erd", 
  loading,
  onFitView, 
  onAutoLayout, 
  onExportPNG,
  onExportPDF,
  onSearch,
  onToggleStats,
  layoutDirection="LR",
  onLayoutDirectionChange
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoverFitView, setHoverFitView] = useState(false);
  const [hoverAutoLayout, setHoverAutoLayout] = useState(false);
  const [hoverExportPNG, setHoverExportPNG] = useState(false);
  const [hoverExportPDF, setHoverExportPDF] = useState(false);
  const [hoverStats, setHoverStats] = useState(false);

  const [pngLoading, setPngLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePNG = async () => {
    setPngLoading(true);
    if (onExportPNG) await onExportPNG();
    setPngLoading(false);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    if (onExportPDF) await onExportPDF();
    setPdfLoading(false);
  };

  const getBaseBtnStyle = (isDisabled) => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    cursor: isDisabled ? 'default' : 'pointer',
    opacity: isDisabled ? 0.38 : 1,
    pointerEvents: isDisabled ? 'none' : 'auto',
    borderRadius: '6px',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{
        height: '48px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        backgroundColor: 'var(--color-background-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
        
        {/* LEFT: brand + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '7px', 
            height: '7px', 
            backgroundColor: 'green', 
            borderRadius: '50%' 
          }} />
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontWeight: 500, 
            color: 'var(--color-text-primary)' 
          }}>
            {appName}
          </span>
          <span style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            padding: '2px 8px',
            borderRadius: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            VIEWER
          </span>
        </div>

        {/* MIDDLE: fit view, auto layout, layout direction, search, stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={onFitView}
            onMouseEnter={() => setHoverFitView(true)}
            onMouseLeave={() => setHoverFitView(false)}
            style={{
              ...getBaseBtnStyle(loading),
              backgroundColor: hoverFitView ? 'var(--color-background-secondary)' : 'transparent',
              color: 'var(--color-text-secondary)',
              border: 'none',
            }}
          >
            fit view
          </button>
          
          <button 
            onClick={onAutoLayout}
            onMouseEnter={() => setHoverAutoLayout(true)}
            onMouseLeave={() => setHoverAutoLayout(false)}
            style={{
              ...getBaseBtnStyle(loading),
              backgroundColor: hoverAutoLayout ? 'var(--color-background-secondary)' : 'transparent',
              color: 'var(--color-text-secondary)',
              border: 'none',
            }}
          >
            auto layout
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: '6px',
            padding: '2px',
            marginLeft: '4px'
          }}>
            <button
              onClick={() => onLayoutDirectionChange && onLayoutDirectionChange('LR')}
              title="Horizontal layout"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                backgroundColor: layoutDirection === 'LR' ? 'var(--color-background-primary)' : 'transparent',
                color: layoutDirection === 'LR' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              Horizontal
            </button>
            <button
              onClick={() => onLayoutDirectionChange && onLayoutDirectionChange('TB')}
              title="Vertical layout"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                backgroundColor: layoutDirection === 'TB' ? 'var(--color-background-primary)' : 'transparent',
                color: layoutDirection === 'TB' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              Vertical
            </button>
          </div>
          
          <div style={{ width: '0.5px', height: '20px', backgroundColor: 'var(--color-border-secondary)', margin: '0 4px' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '8px', color: '#64748b', fontSize: '12px' }}>🔍</span>
            <input 
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              style={{
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border-secondary)',
                borderRadius: '6px',
                padding: '4px 8px 4px 28px',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                width: '180px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ width: '0.5px', height: '20px', backgroundColor: 'var(--color-border-secondary)', margin: '0 4px' }} />

          <button 
            onClick={onToggleStats}
            onMouseEnter={() => setHoverStats(true)}
            onMouseLeave={() => setHoverStats(false)}
            style={{
              ...getBaseBtnStyle(false),
              backgroundColor: hoverStats ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              marginRight: '8px'
            }}
          >
            📊 Stats
          </button>
        </div>

        {/* RIGHT: export PNG, export PDF */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handlePNG}
            onMouseEnter={() => setHoverExportPNG(true)}
            onMouseLeave={() => setHoverExportPNG(false)}
            style={{
              ...getBaseBtnStyle(loading || pngLoading),
              backgroundColor: hoverExportPNG ? 'var(--color-background-tertiary)' : 'var(--color-background-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-secondary)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              opacity: pngLoading ? 0.6 : (loading ? 0.38 : 1)
            }}
          >
            {pngLoading ? 'exporting...' : 'export PNG'}
          </button>
          
          <button 
            onClick={handlePDF}
            onMouseEnter={() => setHoverExportPDF(true)}
            onMouseLeave={() => setHoverExportPDF(false)}
            style={{
              ...getBaseBtnStyle(loading || pdfLoading),
              backgroundColor: hoverExportPDF ? 'var(--color-background-tertiary)' : 'var(--color-background-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-secondary)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              opacity: pdfLoading ? 0.6 : (loading ? 0.38 : 1)
            }}
          >
            {pdfLoading ? 'exporting...' : 'export PDF'}
          </button>
        </div>

      </div>
  );
}
