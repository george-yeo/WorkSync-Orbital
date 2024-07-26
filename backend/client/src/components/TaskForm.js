import React, { useState } from 'react';
import { useTaskContext } from '../hooks/useTaskContext';
import { useAuthContext } from '../hooks/useAuthContext';

const TaskForm = ({ section, closePopup, editingTask, isGroup, group_id }) => {
  const { dispatch } = useTaskContext();
  const { user } = useAuthContext();

  const [title, setTitle] = useState(editingTask ? editingTask.title : '');
  const [description, setDescription] = useState(editingTask ? editingTask.description : '');
  const [deadline, setDeadline] = useState(editingTask ? editingTask.deadline : null);
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in');
      return;
    }

    let response, task;

    if (editingTask) {
      task = {
        title,
        description,
        deadline,
        isCompleted: editingTask.isCompleted,
        sectionId: editingTask.sectionId
      }
      response = await fetch('/api/tasks/' + editingTask._id, {
        method: 'PATCH',
        body: JSON.stringify(task),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        }
      })
    } else {
      // if (section.isGroup){
      //   task = { title, description, deadline, isCompleted: false, sectionId: section._id, user_id: section.user_id }
      //   response = await fetch('/api/tasks/createGroupTask', {
      //     method: 'POST',
      //     body: JSON.stringify(task),
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Authorization': `Bearer ${user.token}`
      //     }
      //   });
      // } else {
        task = { title, description, deadline, isCompleted: false, sectionId: section._id, group_id }

        if (group_id) {
          response = await fetch('/api/tasks/createGroupTask', {
            method: 'POST',
            body: JSON.stringify(task),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            }
          });
        } else {
          response = await fetch('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(task),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            }
          });
        }
      // }
    }

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

      dispatch({ type: editingTask ? 'UPDATE_TASK' : 'CREATE_TASK', payload: editingTask ? json.task : json });

      closePopup();
    }
  };

  return (
    <div className="popup-form">
      <div className="popup-content">
        <span className="close-btn" onClick={closePopup}>&times;</span>
        <form className="create" onSubmit={handleSubmit}>
          <h3>{editingTask && "Edit Task"}{!editingTask && "Add a new Task"}</h3>
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
              placeholder="Description (Optional)"
              className="task-detail-form"
            />
            <label className="task-detail-deadline">Deadline: </label>
            <input
              type="date"
              onChange={(e) => setDeadline(e.target.value)}
              value={deadline}
              defaultValue={deadline}
              className="task-detail-form"
            />
          </div>
          <button>{editingTask && "Confirm Edit"}{!editingTask && "Add Task"}</button>
          {error && <div className='error'>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default TaskForm;