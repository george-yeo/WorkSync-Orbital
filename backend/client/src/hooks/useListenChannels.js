import { useState, useEffect } from 'react'
import { useSocketContext } from './useSocketContext'
import { useChatContext } from './useChatContext'

export const useListenChannels = () => {
  const { socket } = useSocketContext()
  const chatContext = useChatContext()

  useEffect(() =>{
    socket?.on("newChannel", (newChannel) => {
      chatContext.dispatch({type: 'UPDATE_CHANNEL', payload: newChannel})
    })

    return () => {
      socket?.off("newChannel")
    }
  }, [socket, chatContext])
}