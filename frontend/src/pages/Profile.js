import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useLogin } from "../hooks/useLogin"
import { useAuthContext } from '../hooks/useAuthContext';
import EditProfileBtn from '../components/EditProfileBtn';
import DP from '../DP.jpg'

const Profile = () => {
    const { user } = useAuthContext()
    const [userData, setUserData] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
          const response = await fetch(`/api/user/getUser/` + user._id, {
            headers: {'Authorization': `Bearer ${user.token}`},
          })
          
          const json = await response.json()
          console.log('user', json)
          setUserData(json[0]);
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
                  <img src={DP} alt="Profile" />
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
                <button className="button-change-password">Change Password</button>
          </div>
      </div>
    )
  }
  
  export default Profile;
