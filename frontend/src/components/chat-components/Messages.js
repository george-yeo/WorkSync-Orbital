import { useState, useRef, useEffect } from "react"
import { useChatContext } from '../../hooks/useChatContext'

// components
import Message from './Message';
import FirstTimeMessage from "./FirstTimeMessage";
import { useListenMessages } from "../../hooks/useListenMessages";

const Messages = ({ channel, messages }) => {
  const chatContext = useChatContext()
  useListenMessages(channel._id)
  
  const messagesEndRef  = useRef(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: chatContext.newMessageUpdate ? "smooth" : "instant" })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages]);
  
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