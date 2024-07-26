import React, { useState } from 'react';
import TaskForm from './TaskForm';

const TaskFormBtn = ({ section, group_id }) => {
  const [showPopup, setShowPopup] = useState(false);

  const openPopup = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="create-task">
      <button className="open-form-btn" onClick={openPopup}>{group_id !== undefined ? "Create Task for all Members" : "Add Task"}</button>
      {showPopup && <TaskForm section={section} closePopup={closePopup} group_id={group_id} />}
    </div>
  );
};

export default TaskFormBtn;