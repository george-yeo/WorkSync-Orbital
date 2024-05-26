import { useState } from "react"
import { useSectionContext } from "../hooks/useSectionContext"
import { useAuthContext } from '../hooks/useAuthContext'

const SectionForm = ({ section }) => {
    const { dispatch } = useSectionContext()
    const { user } = useAuthContext()

    const [title, setTitle] = useState('')
    const [error, setError] = useState(null)
    const [emptyFields, setEmptyFields] = useState([])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user) {
            setError('You must be logged in')
            return
        }

        const section = {title}

        const response = await fetch('/api/sections', {
            method: 'POST',
            body: JSON.stringify(section),
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
            setError(null)
            setEmptyFields([])
            dispatch({type: 'CREATE_SECTION', payload: json})
            console.log("new section added", json)
        }
    }

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Add a new Section</h3>

            <label>Section Name: </label>
            <input
                type="text"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                className={emptyFields.includes('title') ? 'error' : ''}
            />

            <button>Add Section</button>
            {error && <div className='error'>{error}</div>}
        </form>
    )
}

export default SectionForm