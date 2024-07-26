import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'

const NoChatSelected = ({ channel }) => {
  const { user } = useAuthContext()
  
  if (!user) return 

  return (
    <div className="none-selected">
      <p>Welcome {user.username}!</p>
      <p>Select a chat to start messaging.</p>
      <span className="material-symbols-outlined">message</span>
    </div>
  )
}

export default NoChatSelected