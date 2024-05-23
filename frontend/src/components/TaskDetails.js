import { useTaskContext } from "../hooks/useTaskContext"
import { useAuthContext } from "../hooks/useAuthContext";

// date-fns
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const TaskDetails = ({ task }) => {
    const { dispatch } = useTaskContext();
    const { user } = useAuthContext()
    

    const handleClick = async () => {
        if (!user) {
            return
        }

        const response = await fetch('/api/tasks/' + task._id, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const json = await response.json()

        if (response.ok) {
            dispatch({type: 'DELETE_TASK', payload: json})
        }
    }

    return (
        <div className="task-details">
            <h4>{task.title}</h4>
            <p><strong>Description: </strong>{task.description}</p>
            <p><strong>Deadline: </strong>{task.deadline}</p>
            <p><strong>Completed: </strong>{task.isCompleted}</p>
            <p>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</p>
            <span className="material-symbols-outlined" onClick={handleClick}>delete</span>
        </div>
    )
}

export default TaskDetails