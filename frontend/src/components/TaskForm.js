import { useState } from "react"
import { useTaskContext } from "../hooks/useTaskContext"
import { useAuthContext } from '../hooks/useAuthContext'

const TaskForm = () => {
    const { dispatch } = useTaskContext()
    const { user } = useAuthContext()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState(0)
    const [error, setError] = useState(null)
    const [emptyFields, setEmptyFields] = useState([])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user) {
            setError('You must be logged in')
            return
        }

        const task = {title, description, deadline, isCompleted: false}

        const response = await fetch('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(task),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })

        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
            setEmptyFields(json.emptyFields)
        }
        if (response.ok) {
            setTitle('')
            setDescription('')
            setDeadline(0)
            setError(null)
            setEmptyFields([])
            dispatch({type: 'CREATE_TASK', payload: json})
            console.log("new task added", json)
        }
    }

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Add a new Task</h3>

            <label>Task Name: </label>
            <input
                type="text"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                className={emptyFields.includes('title') ? 'error' : ''}
            />

            <label>Description: </label>
                <input
                    type="text"
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                />

            <label>Deadline: </label>
                <input
                    type="date"
                    onChange={(e) => setDeadline(e.target.value)}
                    value={deadline}
                />

            <button>Add Task</button>
            {error && <div className='error'>{error}</div>}
        </form>
    )
}

export default TaskForm