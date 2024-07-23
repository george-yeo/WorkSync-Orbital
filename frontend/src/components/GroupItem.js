import { Link } from 'react-router-dom'
import { useAuthContext } from "../hooks/useAuthContext";
import { useGroupContext } from "../hooks/useGroupContext";

const GroupItem = ({ group }) => {
    const { user } = useAuthContext();
    const { groups, dispatch } = useGroupContext();
    
    // Function to handle request to join a group
    const handleRequestJoin = async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/group/join/${group._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
            });

            const json = await response.json();

            if (response.ok) {
                const updatedGroup = structuredClone(group)
                updatedGroup.requestID = [...updatedGroup.requestID, user]
                dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
                dispatch({ type: 'CREATE_GROUP', payload: updatedGroup });
            } else {
                console.error("Failed to send request to join group:", json.error);
            }
        } catch (error) {
            console.error("Failed to send request to join group:", error);
        }
    };

    // Function to cancel request to join a group
    const handleCancelRequest = async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/group/cancel/${group._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
            });

            const json = await response.json();

            if (response.ok) {
                const updatedGroup = structuredClone(group)
                updatedGroup.requestID = group.requestID.filter(u => u._id !== user._id)
                dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
                dispatch({ type: 'DELETE_GROUP', payload: group._id });
            } else {
                console.error("Failed to cancel request:", json.error);
            }
        } catch (error) {
            console.error("Failed to cancel request:", error);
        }
    };

    const isMember = group.createdByID._id == user._id || group.membersID.findIndex(u => u._id == user._id) >= 0
    const isRequested = group.requestID.findIndex(u => u._id == user._id) >= 0
    const isPrivate = group.isPrivate == true
    
    return (
        <div className="group-item" key={group._id}>
            <div className="group-header">
                <img className="group-pic"
                    src= {`data:image/jpeg;base64, ${group.groupPic}`}  
                    alt="Channel Picture" 
                />
                <div className="group-details">
                    <h2>{group.name}</h2>
                    <div className="group-stats">
                        {isPrivate ? "Private" : "Public"}
                        <div className="members">
                            {group.membersID.length+1} <span className="material-symbols-outlined">group</span>
                        </div>
                        <div className="trees-grown">
                            {group.treesGrown}<img className="tree" src="../tree.png"></img>
                        </div>
                    </div>
                </div>
            </div>
            {!isMember && !isPrivate && !isRequested && <button className="add-btn view" onClick={handleRequestJoin}>Request Join</button>}
            {!isMember && isRequested && <button className="delete-btn view" onClick={() => handleCancelRequest(user._id)}>Cancel Request</button>}
            {isMember && <Link className="add-btn view" to={"/group/"+group._id}>View</Link>}
        </div>
    )
    
    // return (
    //     <div className="group-item" key={group._id}>
    //     <h2>{group.name}</h2>
    //     <p><b>Owner:</b> {group.createdByID.username}</p>
    //     <div><b>Member:</b> {group.membersID.map((member) => (
    //         <p><span key={member}>
    //         {member.username}
    //         <button className="remove-btn" onClick={() => handleRemoveUserClick(group._id, member.username)}>Remove</button>
    //         </span></p>
    //     ))}
    //     </div>
    //     <p>
    //     <b>Pending: </b> 
    //     {group.pendingID.map(member => member.username).join(', ')}
    //     {group.requestID.length > 0 && group.pendingID.length > 0 && ', '}
    //     {group.requestID.map(member => member.username).join(', ')}
    //     </p>
    //     <button className="add-btn" onClick={() => handleAddUserClick(group._id)}>Add User</button>
    //     {group.createdByID._id === user._id && (
    //         <button className="delete-btn" onClick={() => handleDeleteGroupClick(group._id, group.sectionID)}>Delete Group</button>
    //     )}
    //     <Link to={"/group/"+group._id}>View Group</Link>
    //     </div>
    // )
}

export default GroupItem