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
            <img src={channel.pic} alt=""/>
        </span>
        <span className="content">
            <h4>{channel.name}</h4>
            <div>{channel.lastMessage}</div>
        </span>
      </li>
    )
  }
  
  export default Channel