import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import EditProfileBtn from '../components/EditProfileBtn';
import PasswordBtn from '../components/PasswordBtn';
import ProfilePic from '../components/ProfilePic';

const Profile = () => {
    const { user } = useAuthContext()
    const [userData, setUserData] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    const openPopup = () => {
        setShowPopup(true);
      };
    
      const closePopup = () => {
        setShowPopup(false);
      };

    useEffect(() => {
        const fetchUser = async () => {
          const response = await fetch(`/api/user/getUser/` + user._id, {
            headers: {'Authorization': `Bearer ${user.token}`},
          })
          
          const json = await response.json()
          setUserData(json[0])
          console.log('user', userData.profilePic)
        }
        if(user){
          fetchUser()
        }
    }, [user])

    return (
      <div className='profile'>
          <h2 className='profile-title'>Profile Page</h2>
          <div className='profile-content'>
              <div className='profile-container'>
                <div className='profile-pic'>
                  <img
                    src= {`data:image/jpeg;base64, ${userData.profilePic}`}  
                    alt="Profile Picture" 
                    onClick={openPopup}
                    />
                    {showPopup && <ProfilePic closePopup={closePopup} />}
                    <span class="material-symbols-outlined"> edit_square</span>
                    </div>
                  <h3>{userData.username}</h3>
                  <p><strong>Display Name: </strong><span>{userData.displayname}</span></p>
                  <p><strong>Email: </strong><span>{userData.email}</span></p>
              </div>
              <div className='profile-info'>
                  <div className='info-item'>
                      <strong>User Name: </strong><span>{userData.username}</span>
                  </div>
                  <div className='info-item'>
                      <strong>Display Name: </strong><span>{userData.displayname}</span>
                  </div>
                  <div className='info-item'>
                      <strong>Email: </strong><span>{userData.email}</span>
                  </div>
                  <div className='info-item'>
                      <strong>Gender: </strong><span>{userData.gender}</span>
                  </div>
              </div>
          </div>
          <div className="buttons">
                <EditProfileBtn></EditProfileBtn>
                <PasswordBtn></PasswordBtn>
          </div>
      </div>
    )
  }
  
  export default Profile;
