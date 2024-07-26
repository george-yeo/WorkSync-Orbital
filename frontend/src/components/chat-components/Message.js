import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'

// date-fns
import { formatRelative } from "date-fns"

const Message = ({ channel, message }) => {
  const { user } = useAuthContext()

  const createdAt = new Date(message.createdAt)
  const date = formatRelative(createdAt, new Date())

  const pic = channel.participants[channel.participants.findIndex((participant) => participant._id === message.senderId)].profilePic

  const isSender = message.senderId === user._id

  return (
    <li className="chat-message">
      <span className={"picture " + (isSender ? "right" : "left")}>
        <img
          src= {`data:image/jpeg;base64, ${pic}`}  
          alt="Channel Picture" 
        />
      </span>
      <span className={"content " + (isSender ? "left" : "right")}>
          <div>{message.message}</div>
          <div className="timestamp">{date.charAt(0).toUpperCase() + date.slice(1)}</div>
      </span>
    </li>
  )
}
  
export default Message