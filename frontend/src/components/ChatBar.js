import { useEffect, useState } from "react"
import { useAuthContext } from '../hooks/useAuthContext'
import { useChatContext } from '../hooks/useChatContext'

// components
import Search from './chat-components/Search';
import Channels from './chat-components/Channels';
import Messages from './chat-components/Messages';
import MessageInput from './chat-components/MessageInput'

const ChatBar = () => {
  const { user } = useAuthContext()
  const chatContext = useChatContext()

  const [channel, setChannel] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)

  const selectChannel = async (channel) => {
    if (channel.type === "direct") {
      for (const i in channel.participants) {
        const receiver = channel.participants[i]
        if (receiver._id !== user._id) {
          chatContext.dispatch({type: 'SET_DIRECT', payload: receiver._id})
        }
      }
    }
    setChannel(channel._id)
    fetchSelectedChannel(channel._id)
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
        chatContext.dispatch({type: 'SET_CHANNELS', payload: json})
      } else {
        setError(json.error)
      }
    }

    if (user) {
      fetchChannels()
      if (channel) {
        fetchSelectedChannel(channel)
      }
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
            <div className='messages'>
              <Messages messages={chatContext.messages} />
            </div>
            <MessageInput />
          </div>
        </div>
    </div>
  )
}

export default ChatBar