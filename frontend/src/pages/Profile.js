import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';

const Profile = ({ }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const {update, error, isLoading} = useProfile()
  
    const handleSubmit = async (e) => {
      e.preventDefault()
  
      await update(email, password, username)
    }
  
    return (
      <form className="Profile" onSubmit={handleSubmit}>
          <h3>Profile</h3>
  
          <label>Username:</label>
          <input 
          type="username" 
          onChange={(e) => setUsername(e.target.value)} 
          value={username} 
          />
          <label>Email address:</label>
          <input 
          type="email" 
          onChange={(e) => setEmail(e.target.value)} 
          value={email} 
          />
          <label>Password:</label>
          <input 
          type="password" 
          onChange={(e) => setPassword(e.target.value)} 
          value={password} 
          />
          
          <button disabled={isLoading}>Edit</button>
          {error && <div className="error">{error}</div>}
      </form>
    )
  }
  
  export default Profile;
