import { useEffect, useState } from "react"
import { useAuthContext } from '../hooks/useAuthContext'
import { useChatContext } from '../hooks/useChatContext'

// components
import Search from './chat-components/Search';
import Channels from './chat-components/Channels';
import ChannelHeader from './chat-components/ChannelHeader';
import Messages from './chat-components/Messages';
import MessageInput from './chat-components/MessageInput'
import NoChatSelected from './chat-components/NoChatSelected'

const ChatBar = () => {
  const { user } = useAuthContext()
  const chatContext = useChatContext()

  const [channel, setChannel] = useState(null)
  const [error, setError] = useState(null)

  const selectChannel = async (newChannel) => {
    if (newChannel == channel) return
    if (newChannel.type === "direct") {
      for (const i in newChannel.participants) {
        const receiver = newChannel.participants[i]
        if (receiver._id !== user._id) {
          chatContext.dispatch({type: 'SET_DIRECT', payload: receiver._id})
        }
      }
    }
    setChannel(newChannel)
    fetchSelectedChannel(newChannel._id)
  }

  const fetchSelectedChannel = async (channelId) => {
    const response = await fetch(`/api/chats/` + channelId, {
      headers: {'Authorization': `Bearer ${user.token}`},
    })
    
    const json = await response.json()

    if (response.ok) {
      setError(null)
      chatContext.dispatch({type: 'SET_MESSAGES', payload: json})
    } else {
      setError(json.error)
    }
  }

  useEffect(() => {
    const fetchChannels = async () => {
      const response = await fetch(`/api/chats/recent`, {
        headers: {'Authorization': `Bearer ${user.token}`},
      })
      
      const json = await response.json()
      
      if (response.ok) {
        setError(null)
        chatContext.dispatch({type: 'SET_CHANNELS', payload: json, isRecent: true})
      } else {
        setError(json.error)
      }
    }

    if (user) {
      fetchChannels()
    }
  }, [user])

  return (
    <div className="container chat">
        <div className='chat-header'>
          <h4>Chat</h4>
        </div>
        <div className="chat-contents">
          <div className='chat-channels'>
            <Search />
            <Channels channels={chatContext.channels} selectChannel={selectChannel}/>
          </div>
          <div className='chat-chat'>
            {channel && <ChannelHeader channel={channel} />}
            {channel && <div className='messages'>
              <Messages channel={channel} messages={chatContext.messages} />
            </div>}
            {channel && <MessageInput />}
            {!channel && <NoChatSelected />}
          </div>
        </div>
    </div>
  )
}

export default ChatBar