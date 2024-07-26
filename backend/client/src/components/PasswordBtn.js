import React, { useState } from 'react';
import PasswordForm from './PasswordForm';

const PasswordBtn = () => {
  const [showPopup, setShowPopup] = useState(false);

  const openPopup = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div>
      <button className="button-change-password" onClick={openPopup}>Change Password</button>
      {showPopup && <PasswordForm closePopup={closePopup} />}
    </div>
  );
};

export default PasswordBtn;