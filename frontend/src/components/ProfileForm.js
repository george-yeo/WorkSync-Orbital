import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuthContext } from '../hooks/useAuthContext';

const ProfileForm = ({ closePopup }) => {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [gender, setGender] = useState('')
    const [displayname, setDisplayname] = useState('')
    const {update} = useProfile()
    const { user } = useAuthContext()
    const [userData, setUserData] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchUser = async () => {
        const response = await fetch(`/api/user/getUser/` + user._id, {
          headers: {'Authorization': `Bearer ${user.token}`},
        })
        
        const json = await response.json()
        console.log('user', json)
        setUserData(json);
        setUsername(json.username)
        setEmail(json.email)
        setDisplayname(json.displayname)
        setGender(json.gender)
        setIsLoading(false)
      }
      if(user){
        fetchUser()
      }
    }, [user])

    const handleSubmit = async (e) => {
      console.log(displayname)
      await update(email, username, displayname, gender)
      closePopup();
    }

    if (isLoading) {
      return <div>Loading...</div>; // Display a loading indicator while fetching data
    }

    return (
    <div className="popup-form">
      <div className="popup-content">
        <span className="close-btn" onClick={closePopup}>&times;</span>
        <form className="create" onSubmit={handleSubmit}>
            <h3>Edit Profile</h3>
            <label>
              Username:
              <input type="text" name="username" defaultValue={user.username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label>
              Display Name:
              <input type="text" name="displayname" defaultValue={user.displayname} onChange={(e) => setDisplayname(e.target.value)}/>
            </label>
            <label>
              Email:
              <input type="text" name="email" defaultValue={user.email} onChange={(e) => setEmail(e.target.value)}/>
            </label>
            <label>
              Gender:
              <input type="text" name="gender" defaultValue={user.gender} onChange={(e) => setGender(e.target.value)}/>
            </label>
            <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default ProfileForm;