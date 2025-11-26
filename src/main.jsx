import React from 'react';
import ReactDOM from 'react-dom/client';
import CommanderApp from './App.jsx';
import './index.css'; // Supponendo che tu abbia un file CSS per Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CommanderApp />
  </React.StrictMode>,
);