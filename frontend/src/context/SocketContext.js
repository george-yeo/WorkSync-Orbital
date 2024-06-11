import { createContext, useReducer, useEffect, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import io from "socket.io-client"

export const SocketContext = createContext()

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const { user } = useAuthContext()

  useEffect(() => {
    if (user) {
      const socket = io({
        query: {
          userId: user._id
        }
      })

      console.log("CONNECTING SOCKET")

      setSocket(socket)

      socket.on("getOnlineUsers", (users) => {
        console.log(users)
        setOnlineUsers(users)
      })

      return () => socket.close()
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
      }
    }
  }, [user])
  
  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      { children }
    </SocketContext.Provider>
  )
}
