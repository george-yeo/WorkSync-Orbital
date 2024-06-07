import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useProfile = ( ) => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(null)
  const { user } = useAuthContext()


  const update = async (email, username, displayname, gender) => {

    setIsLoading(true)
    setError(null)


    const response = await fetch('/api/user/update/' + user._id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ email, username, displayname, gender})
    })
    const json = await response.json()

    if (!response.ok) {
      setIsLoading(false)
      setError(json.error)
      return false
    }
    return true
  }

  const changePassword = async ( currPassword, newPassword, confirmPassword ) => {
    const response = await fetch('/api/user/changePassword/' + user._id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ currPassword, newPassword, confirmPassword })
    })
    const json = await response.json()

    if (!response.ok) {
      setError(json.error)
      return false
    }

    return true
  }

  return { update, changePassword, isLoading, error }
}