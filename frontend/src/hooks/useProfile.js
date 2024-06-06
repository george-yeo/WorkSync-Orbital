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
  }
  return { update, isLoading, error }
}