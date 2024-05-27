import { useTaskContext } from "../hooks/useTaskContext"
import { useAuthContext } from "../hooks/useAuthContext";

// date-fns
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const TaskDetails = ({ task }) => {
    const { dispatch } = useTaskContext();
    const { user } = useAuthContext()
    

    const handleDeleteClick = async () => {
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

    const handleCompleteClick = async () => {
        if (!user) {
            return
        }
        
        task.isCompleted = !task.isCompleted

        const response = await fetch('/api/tasks/' + task._id, {
            method: 'PATCH',
            body: JSON.stringify(task),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })
        const json = await response.json()

        if (response.ok) {
            dispatch({type: 'UPDATE_TASK', payload: JSON.stringify(task)})
        }
    }

    return (
        <li className={"task-details" + (task.isCompleted ? " checked" : "")}>
            <span className="material-symbols-outlined checkbox" onClick={handleCompleteClick}>
                circle
                <span className={"material-symbols-outlined tick" + (!task.isCompleted ? " hide" : "")}>check</span>
            </span>
            <h4>{task.title}</h4>
            <span className="material-symbols-outlined delete hide" onClick={handleDeleteClick}>delete</span>
        </li>
    )
}

/*<p><strong>Description: </strong>{task.description}</p>
            <p><strong>Deadline: </strong>{task.deadline}</p>
            <p><strong>Completed: </strong>{task.isCompleted}</p>
            <p>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</p>*/

export default TaskDetails