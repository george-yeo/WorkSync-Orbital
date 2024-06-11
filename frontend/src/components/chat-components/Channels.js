import { useEffect, useRef } from "react"
import { useChatContext } from '../../hooks/useChatContext'

// components
import Channel from './Channel';

const Channels = ({ channels, selectChannel }) => {
  const chatContext = useChatContext()
  
  return (
    <div>
      <h5>{chatContext.isRecent ? "Recent Chats" : "Search Results"}</h5>
      {!chatContext.isRecent && channels.length === 0 && <div>No results found...</div>}
      {chatContext.isRecent && channels.length === 0 && <div>No recent chats available...</div>}
      <ul>
        {channels && channels.map(channel => (
          <Channel channel={channel} key={channel._id} selectChannel={selectChannel}/>
        ))}
      </ul>
    </div>
  )
}

export default Channels