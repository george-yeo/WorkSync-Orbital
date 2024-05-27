import React, { useState } from 'react';
import TaskForm from './TaskForm';

const TaskFormBtn = ({ section }) => {
  const [showPopup, setShowPopup] = useState(false);

  const openPopup = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div>
      <button className="open-form-btn" onClick={openPopup}>Add Task</button>
      {showPopup && <TaskForm section={section} closePopup={closePopup} />}
    </div>
  );
};

export default TaskFormBtn;