import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent context menu (right click)
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Prevent keyboard shortcuts for dev tools and viewing source
document.addEventListener('keydown', (e) => {
  // F12
  if (e.key === 'F12') {
    e.preventDefault();
  }
  // Ctrl+Shift+I or Cmd+Option+I (DevTools)
  if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) || (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i'))) {
    e.preventDefault();
  }
  // Ctrl+Shift+J or Cmd+Option+J (Console)
  if ((e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) || (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j'))) {
    e.preventDefault();
  }
  // Ctrl+Shift+C or Cmd+Option+C (Element Inspector)
  if ((e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) || (e.metaKey && e.altKey && (e.key === 'C' || e.key === 'c'))) {
    e.preventDefault();
  }
  // Ctrl+U or Cmd+U (View Source)
  if ((e.ctrlKey && (e.key === 'U' || e.key === 'u')) || (e.metaKey && (e.key === 'U' || e.key === 'u'))) {
    e.preventDefault();
  }
  // Ctrl+P or Cmd+P (Print)
  if ((e.ctrlKey && (e.key === 'P' || e.key === 'p')) || (e.metaKey && (e.key === 'P' || e.key === 'p'))) {
    e.preventDefault();
  }
});

// Prevent copying text
document.addEventListener('copy', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
