import { useState } from "react"

// date-fns
import { formatDistanceToNow, differenceInSeconds } from "date-fns"

const Message = ({ message }) => {
    return (
      <li className="container chat-message">
        <div>
            <img src="pic.jpg" alt=""/>
        </div>
        <div>
            <div>{message.message}</div>
            <h5>{formatDistanceToNow(new Date(message.createdAt))}</h5>
        </div>
      </li>
    )
  }
  
  export default Message