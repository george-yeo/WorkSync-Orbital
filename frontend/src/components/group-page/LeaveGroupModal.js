import { useEffect, useState } from "react";
import { useNavigate  } from 'react-router-dom'
import { useGroupContext } from "../../hooks/useGroupContext";
import { useGroupPageContext } from "../../hooks/useGroupPageContext";
import { useAuthContext } from "../../hooks/useAuthContext";
import Modal from 'react-modal';

import Member from "./Member";

const ManageGroupModal = ({ isOpen, setIsLeaveOpen }) => {
    const { user } = useAuthContext();
    const { groups, dispatch } = useGroupContext();
    const groupPageContext = useGroupPageContext();
    const navigate = useNavigate()
    const [status, setStatus] = useState(null);

    const group = groupPageContext.group;

    const handleLeave = async () => {
        if (!user) return;
    
        try {
            // Add the user to the group
            const response = await fetch(`/api/group/leave/` + group._id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
            });

            const json = await response.json();
            
            if (response.ok) {
                dispatch({ type: 'DELETE_GROUP', payload: group._id });
                navigate("/group")
            } else {
                console.error("Error leaving:", json.error);
                setStatus({ success: false, message: json.error });
            }
        } catch (error) {
            console.error("Failed to leave:", error);
            setStatus({ success: false, message: error.message });
        }
    }

    const onClose = () => {
        setStatus(null)
        setIsLeaveOpen(false)
    }

    const handleUploadPic = () => {
        // TODO
    }

    return (
        isOpen && <div className="popup-form">
            <div className="popup-content group-leave">
                <h2 className="title">Leave the Group?</h2>
                <span className="close-btn" onClick={onClose}>&times;</span>
                {status && status.message && (
                    <div className={`status-message ${status.success ? 'success' : 'error'}`}>
                        {status.message}
                    </div>
                )}
                <div className="leave-actions">
                    <button className="add-btn" onClick={handleLeave}>Yes</button>
                    <button className="remove-btn" onClick={onClose}>No</button>
                </div>
            </div>
        </div>
    )
}

export default ManageGroupModal