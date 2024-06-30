import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'

const RequestGroup = ({ channel }) => {
  const { user } = useAuthContext()
  const [requestSent, setRequestSent] = useState(channel.isRequesting == true)
  
  if (!user) return

  const handleClick = async () => {
    if (requestSent) return
    
    setRequestSent(true)
    console.log(channel)
    const response = await fetch(`/api/group/join/${channel.groupID}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ user_id: user._id })
    });
    
    const json = await response.json()
    
    if (!response.ok) {
      //setError(json.error)
      setRequestSent(false)
    }
    if (response.ok) {
      //setError(null)
    }
  }

  return (
    <div className="none-selected">
      <p>Join this group to access the chat!</p>
      <div>
        <button className="chat-request-group-btn" onClick={handleClick}>{!requestSent ? "Request" : "Request sent!"}</button>
      </div>
    </div>
  )
}

export default RequestGroup