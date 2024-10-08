import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useProfile = ( ) => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(null)
  const { user } = useAuthContext()
  const { dispatch } = useAuthContext()


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
    return json
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

  const uploadPic = async ( profilePic ) => {
    const formData = new FormData();
    formData.append('profilePic', profilePic);

    const response = await fetch ('api/user/upload-profile-pic/' + user._id, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      body: formData
    })
    const json = await response.json()

    if (!response.ok) {
      setError(json.error)
      return false
    } else {
      user.profilePic = json
      dispatch({ type: 'UPDATE', payload: user });
      return true
    }
  }

  return { update, changePassword, uploadPic, isLoading, error }
}