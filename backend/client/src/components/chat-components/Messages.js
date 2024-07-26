import { useState, useRef, useEffect } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'
import { useChatContext } from '../../hooks/useChatContext'

// components
import Message from './Message';
import FirstTimeMessage from "./FirstTimeMessage";
import RequestGroup from "./RequestGroup";
import { useListenMessages } from "../../hooks/useListenMessages";

const Messages = ({ channel, messages }) => {
  const { user } = useAuthContext()
  const chatContext = useChatContext()
  useListenMessages(channel._id)
  
  const messagesEndRef = useRef(null)
  
  const scrollToBottom = async () => {
    messagesEndRef.current?.scrollIntoView({ behavior: chatContext.newMessageUpdate ? "smooth" : "instant" })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages]);
  
  if (channel.accessLocked) {
    if (channel.type == "group") {
      return (
        <ul>
        <RequestGroup channel={channel}/>
        </ul>
      )
    }
  }

  if (messages.length === 0) {
    return (
      <ul>
      <FirstTimeMessage/>
      </ul>
    )
  }
  
  return (
    <ul>
      {messages && messages.sort((a,b) => a.createdAt - b.createdAt).map(message => (
        <Message channel={channel} message={message} key={message._id} />
      ))}
      <div ref={messagesEndRef} />
    </ul>
  )
}

export default Messages