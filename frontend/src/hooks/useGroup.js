import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useGroup = ( id ) => {
    const [error, setError] = useState(null)
    const { user } = useAuthContext()

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
        }
    
        return true
    }

    return { uploadPic, error }

}