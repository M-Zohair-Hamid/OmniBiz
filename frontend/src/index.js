import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { setupOfflineInterceptor } from './services/offlineAdapter';
import { App as CapApp } from '@capacitor/app';

// Setup offline interception for fetch & network
setupOfflineInterceptor();

// Handle Android hardware back button
try {
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });
} catch (e) {
  // Ignore in browser
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
