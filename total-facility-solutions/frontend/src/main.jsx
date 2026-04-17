import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              className: 'toast-custom',
              style: {
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                borderRadius: '10px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
                style: { borderLeft: '4px solid #16a34a' },
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
                style: { borderLeft: '4px solid #dc2626' },
              },
            }}
          />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
