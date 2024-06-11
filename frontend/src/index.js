import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TaskContextProvider } from './context/TaskContext'
import { SectionContextProvider } from './context/SectionContext'
import { ChatContextProvider } from './context/ChatContext'
import { AuthContextProvider } from './context/AuthContext'
import { SocketContextProvider } from './context/SocketContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthContextProvider>
      <SocketContextProvider>
        <ChatContextProvider>
          <SectionContextProvider>
            <TaskContextProvider>
              <App />
            </TaskContextProvider>
          </SectionContextProvider>
        </ChatContextProvider>
      </SocketContextProvider>
    </AuthContextProvider>
  </React.StrictMode>
);