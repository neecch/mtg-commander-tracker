import React from 'react';
import ReactDOM from 'react-dom/client';
import CommanderApp from './App.jsx';
// ASSICURATI che questa riga sia presente e corretta
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CommanderApp />
  </React.StrictMode>,
);