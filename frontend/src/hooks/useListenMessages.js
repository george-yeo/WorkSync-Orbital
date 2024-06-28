import { useState, useEffect } from 'react'
import { useSocketContext } from './useSocketContext'
import { useChatContext } from './useChatContext'

export const useListenMessages = ( channelId ) => {
  const { socket } = useSocketContext()
  const chatContext = useChatContext()

  useEffect(() =>{
    socket?.on("newMessage", (newMessage) => {
      console.log(newMessage.channelId, channelId)
      if (newMessage.channelId === channelId) chatContext.dispatch({type: 'UPDATE_MESSAGES', payload: newMessage})
    })

    return () => {
      socket?.off("newMessage")
    }
  }, [socket, chatContext])
}