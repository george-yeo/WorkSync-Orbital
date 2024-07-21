import { useState } from "react"
import { useAuthContext } from '../hooks/useAuthContext'

const GroupForm = ({ isOpen, setIsOpen, onGroupCreated  }) => {
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

        const title = name + " (Group)"

        const responseSection = await fetch('/api/sections/createGroupSection', {
            method: 'POST',
            body: JSON.stringify({title: title}),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })

        const jsonSection = await responseSection.json()

        if (!responseSection.ok) {
            setError(jsonSection.error)
        }

        const group = { 
            name, 
            sectionID: jsonSection._id
        }

        const response = await fetch('/api/group/create', {
            method: 'POST',
            body: JSON.stringify(group),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })

        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
        }
        if (response.ok) {
            setError(null)
            setEmptyFields([])
            setName('')
            setIsOpen(false)
            onGroupCreated(json);
        }
    }

    return (
        isOpen && <div className="popup-form">
            <div className="popup-content group-members">
                <form className="Group-form" onSubmit={handleSubmit}>
                <h2 className="title">Start a Group!</h2>
                <span className="close-btn" onClick={() => setIsOpen(false)}>&times;</span>
                    <label>Group Name: </label>
                    <input
                        type="text"
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        className={emptyFields.includes('name') ? 'error' : ''}
                    />
                    {error && <div className='error'>{error}</div>}
                    <button>Create</button>
                </form>
            </div>
        </div>
    )
}

export default GroupForm