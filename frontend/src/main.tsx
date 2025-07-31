import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for caching and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Apply saved theme preference before React renders
(function applyInitialTheme() {
  if (typeof window !== 'undefined') {
    try {
      const defaultTheme = 'system';
      const savedTheme = JSON.parse(localStorage.getItem('settings_theme') || '{}').theme || defaultTheme;
      const root = window.document.documentElement;
      if (savedTheme === 'dark') {
        root.classList.add('dark');
      } else if (savedTheme === 'light') {
        root.classList.remove('dark');
      } else if (savedTheme === 'system') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    } catch (e) {
      // fallback: system
      const root = window.document.documentElement;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
