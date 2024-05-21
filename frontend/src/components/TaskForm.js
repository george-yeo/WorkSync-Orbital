import { useState } from "react"

const TaskForm = () => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState(0)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()

        const task = {title, description, deadline, isCompleted: false}

        const response = await fetch('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(task),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
        }
        if (response.ok) {
            setTitle('')
            setDescription('')
            setDeadline(0)
            setError(null)
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
            />

            <label>Description: </label>
                <input
                    type="text"
                    onChange={(e) => setDescription(e.target.value)}
                    value={title}
                />

            <label>Deadline: </label>
                <input
                    type="date"
                    onChange={(e) => setDeadline(e.target.value)}
                    value={title}
                />

            <button>Add Task</button>
        </form>
    )
}

export default TaskForm