import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Basic reset and theme setup
const globalStyles = `
  :root {
    --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    --color-background-primary: #111827;
    --color-background-secondary: #1f2937;
    --color-background-tertiary: #374151;
    --color-text-primary: #f9fafb;
    --color-text-secondary: #9ca3af;
    --color-border-secondary: #374151;
    --color-border-tertiary: #1f2937;
  }
  
  body {
    margin: 0;
    padding: 0;
    background-color: var(--color-background-primary);
    color: var(--color-text-primary);
    font-family: system-ui, -apple-system, sans-serif;
    overflow: hidden;
  }

  * {
    box-sizing: border-box;
  }

  .react-flow__controls {
    background-color: #1f2937 !important;
    border: 1px solid #374151 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
    overflow: hidden !important;
  }
  
  .react-flow__controls-button {
    background-color: #1f2937 !important;
    border: none !important;
    border-bottom: 1px solid #374151 !important;
    fill: #f3f4f6 !important;
    color: #f3f4f6 !important;
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background-color 0.2s !important;
  }
  
  .react-flow__controls-button:last-child {
    border-bottom: none !important;
  }
  
  .react-flow__controls-button:hover {
    background-color: #374151 !important;
  }
  
  .react-flow__controls-button svg {
    fill: #f3f4f6 !important;
  }

  .table-fields-scroll {
    overflow-x: hidden !important;
  }

  .table-fields-scroll::-webkit-scrollbar {
    width: 6px;
    height: 0px;
  }
  
  .table-fields-scroll::-webkit-scrollbar:horizontal {
    display: none !important;
    height: 0 !important;
  }

  .table-fields-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .table-fields-scroll::-webkit-scrollbar-thumb {
    background: #374151;
    border-radius: 10px;
  }
  
  .table-fields-scroll::-webkit-scrollbar-thumb:hover {
    background: #4b5563;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = globalStyles;
document.head.appendChild(styleSheet);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
