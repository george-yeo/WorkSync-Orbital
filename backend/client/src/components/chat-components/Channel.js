import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'

const Channel = ({ channel, selectChannel }) => {
    const { user } = useAuthContext()

    const handleClick = async () => {
      selectChannel(channel)
    }

    return (
      <li className="chat-channel" onClick={handleClick}>
        <span className="picture">
            <img
              src= {`data:image/jpeg;base64, ${channel.pic}`}  
              alt="Channel Picture" 
            />
        </span>
        <span className="content">
            <h4>{channel.name}</h4>
            <div>{channel.lastMessage}</div>
        </span>
      </li>
    )
  }
  
  export default Channel