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

    let api = '/api/chats/search-user/' + keyword
    if (!keyword) {
      api = '/api/chats/recent/'
    }

    const response = await fetch(api, {
      headers: {'Authorization': `Bearer ${user.token}`},
    })

    const json = await response.json()

    if (!response.ok) {
        setError(json.error)
    }
    if (response.ok) {
        setError(null)
        chatContext.dispatch({type: 'SET_CHANNELS', payload: json, isRecent: !keyword})
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