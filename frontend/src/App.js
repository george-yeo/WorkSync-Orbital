import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './hooks/useAuthContext'

// pages & components
import Home from './pages/Home'
import Navbar from './components/Navbar'
import ChatBar from './components/ChatBar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Group from './pages/Group'
import GroupPage from './pages/GroupPage'

function App() {
  const { user } = useAuthContext()

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <div className="pages">
          <Routes>
            <Route 
              path="/" 
              element={user ? <Home /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/signup" 
              element={!user ? <Signup /> : <Navigate to="/" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <Profile /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/group" 
              element={user ? <Group /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/group/:id" 
              element={user ? <GroupPage /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
        <ChatBar />
      </BrowserRouter>
    </div>
  );
}

export default App;