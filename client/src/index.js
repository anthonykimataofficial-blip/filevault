import React from 'react';
import ReactDOM from 'react-dom/client';
// ✅ Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Log performance
reportWebVitals();
