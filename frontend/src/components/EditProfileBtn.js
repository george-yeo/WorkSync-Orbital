import React, { useState } from 'react';
import ProfileForm from './ProfileForm';

const EditProfileBtn = () => {
  const [showPopup, setShowPopup] = useState(false);

  const openPopup = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div>
      <button className="button-edit-profile" onClick={openPopup}>Edit profile</button>
      {showPopup && <ProfileForm closePopup={closePopup} />}
    </div>
  );
};

export default EditProfileBtn;