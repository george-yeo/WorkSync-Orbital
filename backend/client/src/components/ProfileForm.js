import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuthContext } from '../hooks/useAuthContext';

const ProfileForm = ({ closePopup }) => {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [gender, setGender] = useState('')
    const [displayname, setDisplayname] = useState('')
    const { update, error} = useProfile()
    const { user, dispatch } = useAuthContext()
    const [userData, setUserData] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchUser = async () => {
        const response = await fetch(`/api/user/getUser/` + user._id, {
          headers: {'Authorization': `Bearer ${user.token}`},
        })
        
        const json = await response.json()
        console.log('user', json)
        setUserData(json[0]);
        setUsername(json[0].username)
        setEmail(json[0].email)
        setDisplayname(json[0].displayname)
        setGender(json[0].gender)
        setIsLoading(false)
      }
      if(user){
        fetchUser()
      }
    }, [user])

    const handleSubmit = async (e) => {
      e.preventDefault()

      const success = await update(email, username, displayname, gender)
      if (success){
        closePopup();
        setUserData(success);
        setUsername(success.username)
        setEmail(success.email)
        setDisplayname(success.displayname)
        setGender(success.gender)
        dispatch({ type: 'UPDATE', payload: success }) 
      }
    }


    return (
    <div className="popup-form">
      <div className="popup-content">
        <span className="close-btn" onClick={closePopup}>&times;</span>
        <form className="create" onSubmit={handleSubmit}>
            <h3>Edit Profile</h3>
            <label>
              Username:
              <input type="text" name="username" defaultValue={userData.username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <ul className="username-reqs">
              <li>4-20 characters</li>
              <li>Only letters and numbers (a-z A-Z 0-9)</li>
            </ul>
            <label>
              Display Name:
              <input type="text" name="displayname" defaultValue={userData.displayname} onChange={(e) => setDisplayname(e.target.value)}/>
            </label>
            <label>
              Email:
              <input type="text" name="email" defaultValue={userData.email} onChange={(e) => setEmail(e.target.value)}/>
            </label>
            <label>
              Gender:
              <p>
                <select 
                name="gender" 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                </select>
              </p>
            </label>
            <button type="submit">Save Changes</button>
            {error && <div className='error'>{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default ProfileForm;