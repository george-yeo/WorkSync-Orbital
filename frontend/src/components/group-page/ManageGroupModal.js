import { useEffect, useState } from "react";
import { useNavigate  } from 'react-router-dom'
import { useGroupContext } from "../../hooks/useGroupContext";
import { useGroupPageContext } from "../../hooks/useGroupPageContext";
import { useAuthContext } from "../../hooks/useAuthContext";
import Modal from 'react-modal';

import Member from "./Member";

const ManageGroupModal = ({ isOpen, setIsManageOpen }) => {
    const { user } = useAuthContext();
    const { groups, dispatch } = useGroupContext();
    const groupPageContext = useGroupPageContext();
    const [status, setStatus] = useState(null);
    const [groupName, setGroupName] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [showPopup, setShowPopup] = useState(false);
    const [file, setFile] = useState(null);
    const navigate = useNavigate()

    const group = groupPageContext.group;

    const isPrivate = group.isPrivate == true

    const handleTogglePrivacy = async () => {
        if (!user) return;
    
        try {
            // Add the user to the group
            const response = await fetch(`/api/group/privacy/` + group._id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ isPrivate: !isPrivate })
            });

            const json = await response.json();
            
            if (response.ok) {
                // Dispatch the updated group which should include both membersID and pendingID
                group.isPrivate = json
                dispatch({ type: 'UPDATE_GROUP', payload: group });
                groupPageContext.dispatch({ type: 'SET_GROUP', payload: group });
                setStatus({ success: true });
            } else {
                console.error("Error revoke invite:", json.error);
                setStatus({ success: false, message: json.error });
            }
        } catch (error) {
            console.error("Failed to revoke invite:", error);
            setStatus({ success: false, message: error.message });
        }
    }

    const handleRenameGroup = async (e) => {
        e.preventDefault()

        if (!user || group.name === groupName) return;
    
        try {
            // Add the user to the group
            const response = await fetch(`/api/group/rename/` + group._id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ name: groupName })
            });

            const json = await response.json();
            
            if (response.ok) {
                // Dispatch the updated group which should include both membersID and pendingID
                group.name = json
                dispatch({ type: 'UPDATE_GROUP', payload: group });
                groupPageContext.dispatch({ type: 'SET_GROUP', payload: group });
                setStatus({ success: true, message: "Name changed successfully!" });
            } else {
                console.error("Error changing name:", json.error);
                setStatus({ success: false, message: json.error });
            }
        } catch (error) {
            console.error("Failed changing name:", error);
            setStatus({ success: false, message: error.message });
        }
    }

    const handleDelete = async () => {
        if (!user) return;
        
        
        try {
            // Add the user to the group
            const response = await fetch(`/api/group/delete/` + group._id, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            const json = await response.json();
            
            if (response.ok) {
                dispatch({ type: 'DELETE_GROUP', payload: group._id });
                navigate("/group")
            } else {
                console.error("Error deleting:", json.error);
                setStatus({ success: false, message: json.error });
            }
        } catch (error) {
            console.error("Failed to revoke invite:", error);
            setStatus({ success: false, message: error.message });
        }
    }

    const onClose = () => {
        setStatus(null)
        setIsManageOpen(false)
    }

    const openPopup = () => {
        setShowPopup(true);
      };
    
    const closePopup = () => {
        setShowPopup(false);
    };


    const handleUploadPic = async() => {
        if (!file || !user) return;

        const formData = new FormData();
        formData.append('groupPic', file);

        try {
            const response = await fetch(`/api/group/change-pic/${group._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                body: formData
            });

            const json = await response.json();

            if (response.ok) {
                group.groupPic = json
                dispatch({ type: 'UPDATE_GROUP', payload: group });
                groupPageContext.dispatch({ type: 'SET_GROUP', payload: group });
                setStatus({ success: true, message: "Picture updated successfully!" });
                closePopup();
            } else {
                console.error("Error uploading picture:", json.error);
                setStatus({ success: false, message: json.error });
            }
        } catch (error) {
            console.error("Failed to upload picture:", error);
            setStatus({ success: false, message: error.message });
        }
    }

    return (
        isOpen && <div className="popup-form">
            <div className="popup-content group-manage">
                <h2 className="title">Group Settings</h2>
                <span className="close-btn" onClick={onClose}>&times;</span>
                <div className="setting">
                    Is Group Public?
                    <button className={isPrivate ? "delete-btn" : "add-btn"} onClick={handleTogglePrivacy}>{isPrivate ? "No" : "Yes"}</button>
                </div>
                <div className="setting">
                    Change Group Picture
                    <button className="add-btn" onClick={openPopup}>Upload</button>
                    {showPopup && (
                        <div className="popup-form">
                            <div className="popup-content">
                                <h3>Upload Group Picture</h3>
                                <span className="close-btn" onClick={closePopup}>&times;</span>
                                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                                <button className="add-btn" onClick={handleUploadPic}>Upload</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="setting">
                    Rename Group
                    <form onSubmit={handleRenameGroup}>
                        <div className="rename-group">
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder={group.name}
                            />
                            <button className="add-btn">Change</button>
                        </div>
                    </form>
                </div>
                {group.createdByID._id == user._id && <div className="setting">
                    {isDeleting ? "Are you really sure you want to Delete the Group?" : "Delete Group"}
                    <div className="kick-actions">
                        {!isDeleting && <button className="remove-btn" onClick={()=>setIsDeleting(true)}>Delete</button>}
                        {isDeleting && <button className="add-btn" onClick={handleDelete}>Yes</button>}
                        {isDeleting && <button className="remove-btn" onClick={()=>setIsDeleting(false)}>No</button>}
                    </div>
                </div>}
                {status && status.message && (
                    <div className={`status-message ${status.success ? 'success' : 'error'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ManageGroupModal