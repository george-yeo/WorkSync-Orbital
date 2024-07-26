import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuthContext } from '../hooks/useAuthContext';

const PasswordForm = ({ closePopup }) => {
    const [currPassword, setCurrPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [comfirmPassword, setComfirmPassword] = useState('')
    const { changePassword, error, isLoading } = useProfile()
    const [showCurrPassword, setShowCurrPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowComfirmPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        const success = await changePassword(currPassword, newPassword, comfirmPassword)
        if (success) {
          closePopup();
          
        }
    }

    return (
    <div className="popup-form">
      <div className="popup-content">
        <span className="close-btn" onClick={closePopup}>&times;</span>
        <form className="create" onSubmit={handleSubmit}>
            <h3>Edit Profile</h3>
            <label>
            Current Password:
              <div className="password-field">
                <input type= {showCurrPassword ? "text" : "password"} name="currPassword" onChange={(e) => setCurrPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowCurrPassword(!showCurrPassword)}
                  className="toggle-btn"
                >
                <span className="material-symbols-outlined">
                  {showCurrPassword ? 'visibility_off' : 'visibility'}
                </span>
                </button>
              </div>
            </label>
            <label>
            New Password:
              <div className="password-field">
                <input type= {showNewPassword ? "text" : "password"} name="newPassword" onChange={(e) => setNewPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="toggle-btn"
                >
                <span className="material-symbols-outlined">
                  {showNewPassword ? 'visibility_off' : 'visibility'}
                </span>
                </button>
              </div>
              <ul className="password-reqs">
                <li>7 characters</li>
                <li>Upper and lowercase</li>
                <li>Numbers and special characters</li>
              </ul>
            </label>
            <label>
            Confirm Password:
              <div className="password-field">
                <input type= {showConfirmPassword ? "text" : "password"} name="confirmPassword" onChange={(e) => setComfirmPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowComfirmPassword(!showConfirmPassword)}
                  className="toggle-btn"
                >
                <span className="material-symbols-outlined">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
                </button>
              </div>
            </label>
            <button type="submit">Save Password</button>
            {error && <div className='error'>{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default PasswordForm;