import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'
import { useSocketContext } from '../../hooks/useSocketContext'

const ChannelHeader = ({ channel }) => {
    const { user } = useAuthContext()
    const { onlineUsers } = useSocketContext()
    let isOnline

    if (channel.type === "direct") {
      isOnline = onlineUsers.includes(channel.participants.find(p => p._id != user._id)._id)
    }

    const handleClick = async () => {
      // display channel info
    }

    if (channel == null) {
      return (
        <div className="channel-header" onClick={handleClick}>
          <span className="picture">
          </span>
          <span className="content">
              <h4></h4>
              <div></div>
          </span>
        </div>
      )
    }

    return (
      <div className="channel-header" onClick={handleClick}>
        <span className="picture">
            <img
              src= {`data:image/jpeg;base64, ${channel.pic}`}  
              alt="Channel Picture" 
            />
        </span>
        <span className="content">
            <h4>{channel.name}</h4>
            <div>{isOnline ? "Online" : "Offline"}</div>
        </span>
      </div>
    )
  }
  
  export default ChannelHeader