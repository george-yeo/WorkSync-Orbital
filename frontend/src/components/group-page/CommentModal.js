import { useEffect, useState } from "react";
import { useNavigate  } from 'react-router-dom'
import { useGroupContext } from "../../hooks/useGroupContext";
import { useGroupPageContext } from "../../hooks/useGroupPageContext";
import { useAuthContext } from "../../hooks/useAuthContext";

const CommentModal = ({ isOpen, setIsCommentOpen }) => {
    const { user } = useAuthContext();
    const { groups, dispatch } = useGroupContext();
    const groupPageContext = useGroupPageContext();
    const navigate = useNavigate()
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState(null);

    const group = groupPageContext.group;

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault()
        }
        
        if (!user || message == '') return;
    
        try {
            // Add the user to the group
            const response = await fetch(`/api/group/comment/` + group._id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ message: message })
            });

            const json = await response.json();
            
            if (response.ok) {
                groupPageContext.dispatch({ type: 'ADD_COMMENT', payload: json });
                onClose()
            } else {
                console.error("Error comment:", json.error);
                setStatus({ success: false, message: json.error });
            }
        } catch (error) {
            console.error("Failed to comment:", error);
            setStatus({ success: false, message: error.message });
        }
    }

    const onClose = () => {
        setStatus(null)
        setIsCommentOpen(false)
    }

    return (
        isOpen && <div className="popup-form">
            <div className="popup-content group-comment">
                <h2 className="title">Add Comment</h2>
                <span className="close-btn" onClick={onClose}>&times;</span>
                <div className="search-user">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter comment here..."
                        />
                        <button className="add-btn view" onClick={handleSubmit}>Post</button>
                    </form>
                </div>
                
                {status && status.message && (
                    <div className={`status-message ${status.success ? 'success' : 'error'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CommentModal