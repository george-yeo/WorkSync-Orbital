import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'

const FirstTimeMessage = ({ channel }) => {
  const { user } = useAuthContext()
  
  if (!user) return 

  return (
    <div className="none-selected">
      <p>There are no messages yet, say hi!</p>
    </div>
  )
}

export default FirstTimeMessage