import { useState, useEffect } from 'react'
import { useSocketContext } from './useSocketContext'
import { useChatContext } from './useChatContext'

export const useListenMessages = ( channelId ) => {
  const { socket } = useSocketContext()
  const chatContext = useChatContext()

  useEffect(() =>{
    socket?.on("newChannel", (newChannel) => {
      chatContext.dispatch({type: 'UPDATE_CHANNEL', payload: newChannel})
    })

    socket?.on("newMessage", (newMessage) => {
      if (newMessage.channelId === channelId) chatContext.dispatch({type: 'UPDATE_MESSAGES', payload: newMessage})
    })

    return () => {
      socket?.off("newChannel")
      socket?.off("newMessage")
    }
  }, [socket, chatContext])
}