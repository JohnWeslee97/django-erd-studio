import React, { useState, useEffect } from 'react';

/**
 * A lightweight toast notification system.
 *
 * Props:
 *   toasts – array of { id, type, title, message }
 *   onDismiss – (id) => void
 */
const typeColors = {
  success: { bg: '#065f46', border: '#10b981', icon: '✓' },
  error:   { bg: '#7f1d1d', border: '#ef4444', icon: '✕' },
  info:    { bg: '#1e3a5f', border: '#3b82f6', icon: 'ℹ' },
  warning: { bg: '#78350f', border: '#f59e0b', icon: '⚠' },
};

function ToastItem({ toast, onDismiss }) {
  const colors = typeColors[toast.type] || typeColors.info;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: '10px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: '#f3f4f6',
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: '13px',
        minWidth: '320px',
        maxWidth: '420px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{colors.icon}</span>
      <div style={{ flex: 1 }}>
        {toast.title && (
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>{toast.title}</div>
        )}
        <div style={{ opacity: 0.9, lineHeight: 1.4 }}>{toast.message}</div>
        {toast.hint && (
          <code
            style={{
              display: 'block',
              marginTop: '8px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: '#fbbf24',
              userSelect: 'all',
              cursor: 'text',
            }}
          >
            {toast.hint}
          </code>
        )}
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '0 2px',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '10px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
