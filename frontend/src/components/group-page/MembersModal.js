import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGroupContext } from "../../hooks/useGroupContext";
import { useGroupPageContext } from "../../hooks/useGroupPageContext";
import { useAuthContext } from "../../hooks/useAuthContext";
import Modal from 'react-modal';

import Member from "./Member";

const MembersModal = ({ isOpen, setIsMembersOpen, canManage }) => {
    const { user } = useAuthContext();
    const { groups, dispatch } = useGroupContext();
    const groupPageContext = useGroupPageContext();

    const [addUserStatus, setAddUserStatus] = useState(null);
    const [usernameToAdd, setUsernameToAdd] = useState('');
    const [searchResults, setSearchResults] = useState(null);

    const group = groupPageContext.group;

    let inviteContainer;

    if (canManage) {
        const handleSearchSubmit = async (e) => {
            e.preventDefault();
            if (!user || !usernameToAdd) return;
    
            try {
                const response = await fetch(`/api/user/search/${usernameToAdd}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
    
                const json = await response.json();
    
                if (response.ok) {
                    setSearchResults(json.filter(user => group.membersID.findIndex(u => user._id == u._id) < 0 && user._id != group.createdByID._id));
                } else {
                    console.error("Error searching user:", json.message);
                }
            } catch (error) {
                console.error("Failed to search user:", error);
            }
        };

        const handleAddUserSubmit = async (e) => {
            if (!user || !usernameToAdd) return;
    
            try {
                // Fetch the user ID based on the username to add
                const response = await fetch(`/api/user/search/` + usernameToAdd, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
    
                const json = await response.json();
                if (json.length === 0) {
                    throw new Error("User not found");
                }
    
                const userIDToAdd = json[0]._id;
    
                // Add the user to the group
                const responseAdd = await fetch(`/api/group/add/` + group._id, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({ user_id: userIDToAdd })
                });
    
                const updatedGroup = await responseAdd.json();
                
                if (responseAdd.ok) {
                    // Dispatch the updated group which should include both membersID and pendingID
                    dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
                    groupPageContext.dispatch({ type: 'SET_GROUP', payload: updatedGroup });
                } else {
                    console.error("Error adding user to group:", updatedGroup.error);
                    setAddUserStatus({ success: false, message: updatedGroup.error });
                }
            } catch (error) {
                console.error("Failed to add user to group:", error);
                setAddUserStatus({ success: false, message: error.message });
            } finally {          
                setUsernameToAdd('');
            }
        };
        
        inviteContainer = (
            <div>
                <h2>Invite User</h2>
                <form onSubmit={handleSearchSubmit}>
                    <div className="search-user">
                        <input
                            type="text"
                            value={usernameToAdd}
                            onChange={(e) => setUsernameToAdd(e.target.value)}
                            placeholder="Enter username here..."
                        />
                        <button type="add-btn">Search</button>
                    </div>
                    {searchResults && searchResults.length == 0 && (
                        <div className="search-results">
                            <h3>Search Results:</h3>
                            <div>
                                Nothing found here...
                            </div>
                        </div>
                    )}
                    {searchResults && searchResults.length > 0 && (
                        <div className="search-results">
                            <h3>Search Results:</h3>
                            {searchResults.map(user => (
                                <div className="search-result">
                                    <div key={user._id}>
                                        {user.displayname + " @" + user.username}
                                    </div>
                                    {group.pendingID.findIndex((u) => u._id == user._id) < 0 && <button className="add-btn" onClick={() => handleAddUserSubmit(user.username)}>Invite</button>}
                                    {group.pendingID.findIndex((u) => u._id == user._id) >= 0 && <div>Invite sent!</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </form>
                {addUserStatus && (
                    <div className={`status-message ${addUserStatus.success ? 'success' : 'error'}`}>
                        {addUserStatus.message}
                    </div>
                )}
            </div>
        )
    }

    return (
        isOpen && <div className="popup-form">
            <div className="popup-content group-members">
                <h2 className="title">Members</h2>
                <span className="close-btn" onClick={() => setIsMembersOpen(false)}>&times;</span>
                <ul className="members">
                    <Member group={group} member={group.createdByID} role="Owner" canManage={canManage} />
                    {group.membersID.map((member) => <Member group={group} member={member} canManage={canManage}/>)}
                </ul>
                {inviteContainer}
            </div>
        </div>
    )
}

export default MembersModal