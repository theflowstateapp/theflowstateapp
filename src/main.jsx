import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found!</div>';
  } else {
    console.log('Root element found, rendering app...');
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('App rendered successfully');
  }
} catch (error) {
  console.error('Error rendering app:', error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;"><h1>Error Loading App</h1><pre>${error.toString()}\n${error.stack}</pre></div>`;
}