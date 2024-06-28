import { useEffect, useState } from "react"
import { useAuthContext } from '../hooks/useAuthContext'
import { useChatContext } from '../hooks/useChatContext'
import { useListenChannels } from "../hooks/useListenChannels";

// components
import Search from './chat-components/Search';
import Channels from './chat-components/Channels';
import ChannelHeader from './chat-components/ChannelHeader';
import Messages from './chat-components/Messages';
import MessageInput from './chat-components/MessageInput'
import NoChatSelected from './chat-components/NoChatSelected'

const ChatBar = () => {
  useListenChannels()

  const { user } = useAuthContext()
  const chatContext = useChatContext()

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
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
    } else {
      chatContext.dispatch({type: 'SET_DIRECT', payload: null})
    }
    setChannel(newChannel)
    fetchSelectedChannel(newChannel._id)
  }

  const fetchSelectedChannel = async (channelId) => {
    setIsFetching(true)

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

    setIsFetching(false)
  }

  useEffect(() => {
    const fetchChannels = async () => {
      setIsFetching(true)

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

      setIsFetching(false)
    }

    if (user) {
      fetchChannels()
    }
  }, [user])

  if (!user) {
    return (<div></div>)
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  return (
    <div className={"container " + (isChatOpen ? "chat" : "chat-closed")}>
        <div className='chat-header' onClick={toggleChat}>
          <h4>Chat</h4>
        </div>
        {isChatOpen && <div className="chat-contents">
          <div className='chat-channels'>
            <Search />
            <Channels channels={chatContext.channels} selectChannel={selectChannel}/>
          </div>
          <div className='chat-chat'>
            {channel && <ChannelHeader channel={channel} />}
            {isFetching && <img className="loading" src="./grey-loading-circle.gif"/>}
            {channel && <div className='messages'>
              {!isFetching && <Messages channel={channel} messages={chatContext.messages} />}
            </div>}
            {channel && <MessageInput channel={channel} setChannel={setChannel}/>}
            {!isFetching && !channel && <NoChatSelected />}
          </div>
        </div>}
    </div>
  )
}

export default ChatBar