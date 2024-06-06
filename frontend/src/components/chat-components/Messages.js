import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'

// components
import Message from './Message';

const Messages = ({ messages }) => {
    const { user } = useAuthContext()
  
    return (
      <ul>
        {messages && messages.sort((a,b) => a.createdAt - b.createdAt).map(message => (
          <Message message={message} key={message._id} />
        ))}
      </ul>
    )
  }
  
  export default Messages