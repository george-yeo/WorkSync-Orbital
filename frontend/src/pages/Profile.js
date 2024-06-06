import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useLogin } from "../hooks/useLogin"
import { useAuthContext } from '../hooks/useAuthContext';
import EditProfileBtn from '../components/EditProfileBtn';
import DP from '../DP.jpg'

const Profile = () => {
    const { user } = useAuthContext()
  
    return (
      <div className='profile'>
          <h2 className='profile-title'>Profile Page</h2>
          <div className='profile-content'>
              <div className='profile-container'>
                  <img src={DP} alt="Profile" />
                  <h3>{user.username}</h3>
                  <p><strong>Display Name: </strong><span>{user.displayname}</span></p>
                  <p><strong>Email: </strong><span>{user.email}</span></p>
              </div>
              <div className='profile-info'>
                  <div className='info-item'>
                      <strong>User Name: </strong><span>{user.username}</span>
                  </div>
                  <div className='info-item'>
                      <strong>Display Name: </strong><span>{user.displayname}</span>
                  </div>
                  <div className='info-item'>
                      <strong>Email: </strong><span>{user.email}</span>
                  </div>
                  <div className='info-item'>
                      <strong>Gender: </strong><span>{user.gender}</span>
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
