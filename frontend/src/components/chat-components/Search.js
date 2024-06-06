import { useState } from "react"
import { useAuthContext } from '../../hooks/useAuthContext'
import { useChatContext } from '../../hooks/useChatContext'

const Channel = () => {
  const { user } = useAuthContext()
  const chatContext = useChatContext()
  const [keyword, setKeyword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
        setError('You must be logged in')
        return
    }

    if (!keyword) {
      return
    }

    const response = await fetch('/api/chats/search-user/' + keyword, {
      headers: {'Authorization': `Bearer ${user.token}`},
    })

    const json = await response.json()

    if (!response.ok) {
        setError(json.error)
    }
    if (response.ok) {
        setError(null)
        chatContext.dispatch({type: 'SET_CHANNELS', payload: json})
    }
  }

  return (
    <div className="chat-search">
      <form onSubmit={handleSubmit}>
        <input
            type="text"
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search..."
            value={keyword}
        />
        <button className="material-symbols-outlined search">search</button>
      </form>
    </div>
  )
}

export default Channel