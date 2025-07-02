import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Starting DomainVault app...');
console.log('Environment variables:', {
  NODE_ENV: import.meta.env.MODE,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing'
});

// Add comprehensive error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial;">Error: Root element not found</div>';
} else {
  console.log('Root element found, rendering app...');
  
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('DomainVault app rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial; max-width: 600px; margin: 0 auto;">
        <h1>DomainVault - Application Error</h1>
        <p>Failed to load the application. Error: ${error}</p>
        <p>Please check the browser console for more details.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
          Reload Page
        </button>
      </div>
    `;
  }
}
