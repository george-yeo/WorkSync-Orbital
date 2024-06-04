import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useProfile = ( ) => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(null)
  const { user, dispatch } = useAuthContext()

  console.log('user from useAuthContext:', user) // Debugging log

  const update = async (email, password, username) => {

    setIsLoading(true)
    setError(null)


    const response = await fetch('/api/user/update/' + user._id, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password, username })
    })
    const json = await response.json()

    if (!response.ok) {
      setIsLoading(false)
      setError(json.error)
    }
    if (response.ok) {
      // save the user to local storage
      localStorage.setItem('user', JSON.stringify(json))

      // update the auth context
      dispatch({ type: 'LOGIN', payload: json })

      // update loading state
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}