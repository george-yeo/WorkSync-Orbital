import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGroupContext } from "../../hooks/useGroupContext";
import { useGroupPageContext } from "../../hooks/useGroupPageContext";
import { useAuthContext } from "../../hooks/useAuthContext";
import Modal from 'react-modal';

const Member = ({ group, member, role, canManage, isInvite, handleRevokeInviteSubmit, isRequest, handleApproveRequest, handleRejectRequest, isSearchInvite, handleAddUserSubmit }) => {
    const { user } = useAuthContext();
    const { groups, dispatch } = useGroupContext();
    const groupPageContext = useGroupPageContext();
    const [isKicking, setIsKicking] = useState(false)

    const handleOnKick = () => {
        setIsKicking(true)
    }

    // Handle Remove User Confirmation
    const handleRemoveUserSubmit = async () => {
        if (!user) return;

        try {
            // Remove the user from the group
            const responseRemove = await fetch(`/api/group/remove/` + group._id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ user_id: member._id })
            });
            
            const updatedGroup = await responseRemove.json();
            if (responseRemove.ok) {
                dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
                groupPageContext.dispatch({ type: 'SET_GROUP', payload: updatedGroup });
            } else {
                console.error("Error removing user from group:", updatedGroup.error);
            }
        } catch (error) {
            console.error("Failed to remove user from group:", error);
        }
    };

    let actionsContainer

    if (isInvite) {
        actionsContainer = (
            <div className="kick-actions">
                <button className="delete-btn" onClick={() => handleRevokeInviteSubmit(member._id)}>Revoke</button>
            </div>
        )
    } else if (isRequest) {
        actionsContainer = (
            <div className="kick-actions">
                <button className="add-btn" onClick={() => handleApproveRequest(member)}>Accept</button>
                <button className="delete-btn" onClick={() => handleRejectRequest(member)}>Deny</button>
            </div>
        )
    } else if (isSearchInvite) {
        actionsContainer = (
            <div className="kick-actions">
                {group.pendingID.findIndex((u) => u._id == member._id) < 0 && <button className="add-btn" onClick={() => handleAddUserSubmit(member._id)}>Invite</button>}
                {group.pendingID.findIndex((u) => u._id == member._id) >= 0 && <div>Invite sent!</div>}
            </div>
        )
    } else {
        actionsContainer = (
            <div className="kick-actions">
                {canManage && member._id != user._id && !isKicking && <button className="remove-btn" onClick={handleOnKick}>Kick</button>}
                {isKicking && <button className="add-btn" onClick={handleRemoveUserSubmit}>Yes</button>}
                {isKicking && <button className="remove-btn" onClick={()=>setIsKicking(false)}>No</button>}
            </div>
        )
    }
    
    return (
        <li className="member">
            <div className="member-details">
                <img
                src= {`data:image/jpeg;base64, ${member.profilePic}`}  
                alt="Profile Picture"
                className="member-pic"
                />
                {isKicking && <div className="member-name">Confirm kick - {member.displayname + " @" + member.username + (role ? " - " + role : "")}?</div>}
                {!isKicking && <div className="member-name">{member.displayname + " @" + member.username + (role ? " - " + role : "")}</div>}
                {actionsContainer}
            </div>
        </li>
    )
}

export default Member