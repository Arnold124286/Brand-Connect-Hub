import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A2235',
            color: '#E2E8F0',
            border: '1px solid #334155',
            fontFamily: '"DM Sans", sans-serif',
          },
          success: { iconTheme: { primary: '#F59E0B', secondary: '#0A0F1E' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
