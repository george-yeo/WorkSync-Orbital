import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'
import { useChatContext } from '../../hooks/useChatContext'

const MessageInput = () => {
  const { user } = useAuthContext()
  const chatContext = useChatContext()
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in')
      return
    }
    
    if (!message) {
      return
    }

    setMessage('')
    
    const response = await fetch('/api/chats/dm/' + chatContext.directTarget, {
      method: 'POST',
      body: JSON.stringify({ message }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    })
    
    const json = await response.json()
    
    if (!response.ok) {
      setError(json.error)
    }
    if (response.ok) {
      setError(null)
      chatContext.dispatch({type: 'UPDATE_MESSAGE', payload: json})
    }
  }
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
        type="text"
        onChange={(e) => setMessage(e.target.value)}
        value={message}
        className="chat-message-input"
        />
        <button className="material-symbols-outlined search">send</button>
      </form>
    </div>
  )
}

export default MessageInput