import { useState } from "react"
import { useAuthContext } from '../hooks/useAuthContext'

const GroupForm = ({ onGroupCreated  }) => {
    const { user } = useAuthContext()

    const [name, setName] = useState('')
    const [error, setError] = useState(null)
    const [emptyFields, setEmptyFields] = useState([])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user) {
            setError('You must be logged in')
            return
        }

        const group = { 
            name, 
            createdBy: user.username,
            createdByID: user._id
        }

        console.log(user._id)

        const response = await fetch('/api/group/create', {
            method: 'POST',
            body: JSON.stringify(group),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })

        console.log(JSON.stringify(group))

        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
        }
        if (response.ok) {
            setError(null)
            setEmptyFields([])
            setName('')
            onGroupCreated(json);
        }
    }

    return (
        <form className="create Group-form" onSubmit={handleSubmit}>
            <h3>Add a new Group</h3>

            <label>Group Name: </label>
            <input
                type="text"
                onChange={(e) => setName(e.target.value)}
                value={name}
                className={emptyFields.includes('name') ? 'error' : ''}
            />

            <button>Add Group</button>
            {error && <div className='error'>{error}</div>}
        </form>
    )
}

export default GroupForm