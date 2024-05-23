import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TaskContextProvider } from './context/TaskContext'
import { AuthContextProvider } from './context/AuthContext'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthContextProvider>
      <TaskContextProvider>
        <App />
      </TaskContextProvider>
    </AuthContextProvider>
  </React.StrictMode>
);