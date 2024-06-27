import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'
import { useChatContext } from '../../hooks/useChatContext'

const MessageInput = ({ channel }) => {
  const { user } = useAuthContext()
  const chatContext = useChatContext()
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  const [isSending, setIsSending] = useState(false)
  
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
    setIsSending(true)

    let url
    if (chatContext.directTarget == null) {
      url = '/api/chats/gm/' + channel._id
    } else {
      url = '/api/chats/dm/' + chatContext.directTarget
    }
    
    const response = await fetch(url, {
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
      if (json.channel) {
        chatContext.dispatch({type: 'UPDATE_CHANNEL', payload: json.channel})
      }
      chatContext.dispatch({type: 'UPDATE_MESSAGES', payload: json.message})
    }

    setIsSending(false)
  }
  
  return (
    <div>
      <form onSubmit={handleSubmit} className="chat-message-form">
        <input
        type="text"
        onChange={(e) => setMessage(e.target.value)}
        value={message}
        className="chat-message-input"
        />
        <button className="material-symbols-outlined send">
          {!isSending ? "send" :
            <img src="./loading-circle.gif"/>
          }
        </button>
      </form>
    </div>
  )
}

export default MessageInput