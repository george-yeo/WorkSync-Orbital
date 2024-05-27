import React, { useState } from 'react';
import { useTaskContext } from '../hooks/useTaskContext';
import { useAuthContext } from '../hooks/useAuthContext';

const TaskForm = ({ section, closePopup }) => {
  const { dispatch } = useTaskContext();
  const { user } = useAuthContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in');
      return;
    }

    const task = { title, description, deadline, isCompleted: false, sectionId: section._id };

    const response = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
      setEmptyFields(json.emptyFields);
    }
    if (response.ok) {
      setTitle('');
      setDescription('');
      setDeadline(null);
      setError(null);
      setEmptyFields([]);
      dispatch({ type: 'CREATE_TASK', payload: json });
      closePopup();
    }
  };

  return (
    <div className="popup-form">
      <div className="popup-content">
        <span className="close-btn" onClick={closePopup}>&times;</span>
        <form className="create" onSubmit={handleSubmit}>
          <h3>Add a new Task</h3>
          <div className="task-detail-box">
            <input
              type="text"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
              className={emptyFields.includes('title') ? 'error' : 'task-detail-form'}
              placeholder="Task name"
            />
            <input
              type="text"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              placeholder="Description"
              className="task-detail-form"
            />
            <label className="task-detail-deadline">Deadline: </label>
            <input
              type="date"
              onChange={(e) => setDeadline(e.target.value)}
              value={deadline}
              className="task-detail-form"
            />
          </div>
          <button>Add Task</button>
          {error && <div className='error'>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default TaskForm;