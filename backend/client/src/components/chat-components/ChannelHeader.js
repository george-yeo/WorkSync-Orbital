import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'
import { useSocketContext } from '../../hooks/useSocketContext'

const ChannelHeader = ({ channel }) => {
    const { user } = useAuthContext()
    const { onlineUsers } = useSocketContext()
    
    let underText = ""

    if (channel.type === "direct") {
      if (onlineUsers.includes(channel.participants.find(p => p._id != user._id)._id)) {
        underText = "Online"
      } else {
        underText = "Offline"
      }
    } else if (channel.type == "group") {
      underText = "Group chat"
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
            <div>{underText}</div>
        </span>
      </div>
    )
  }
  
  export default ChannelHeader