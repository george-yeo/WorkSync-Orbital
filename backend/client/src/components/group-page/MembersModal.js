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
    
    const [inviteRequests, setInviteRequests] = useState([]);
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [error, setError] = useState(null);

    const [joinRequests, setJoinRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [requestActionStatus, setrequestActionStatus] = useState(null);
    const [requestError, setRequestError] = useState(null);

    const group = groupPageContext.group;

    const handleApproveRequest = async (requester) => {
        try{
            const response = await fetch(`/api/group/acceptUser/${group._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ user_id: requester._id })
            })

            if (response.ok) {
                const updatedGroup = structuredClone(group)
                updatedGroup.requestID = updatedGroup.requestID.filter(u => u._id != requester._id)
                updatedGroup.membersID = [...updatedGroup.membersID, requester]
                dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
                groupPageContext.dispatch({ type: 'SET_GROUP', payload: updatedGroup });
                setrequestActionStatus({ success: true, message: 'Request approved' });
            } else {
                const error = await response.json();
                setrequestActionStatus({ success: false, message: `Failed to approve Request: ${error.message}` });
            }
        } catch (error) {
            console.error("Error approving Request:", error);
            setrequestActionStatus({ success: false, message: `Failed to approve Request: ${error.message}` });
        }
    }

    const handleRejectRequest = async (requester) => {
        try{
            const response = await fetch(`/api/group/rejectUser/${group._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ user_id: requester._id })
            })

            if (response.ok) {
                const updatedGroup = structuredClone(group)
                updatedGroup.requestID = updatedGroup.requestID.filter(u => u._id != requester._id)
                dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
                groupPageContext.dispatch({ type: 'SET_GROUP', payload: updatedGroup });
                setrequestActionStatus({ success: true, message: 'Request denied' });
            } else {
                const error = await response.json();
                setrequestActionStatus({ success: false, message: `Failed to deny Request: ${error.message}` });
            }
        } catch (error) {
            console.error("Error approving Request:", error);
            setrequestActionStatus({ success: false, message: `Failed to deny Request: ${error.message}` });
        }
    }

    // useEffect(() => {
    //     if (!canManage) return

    //     const fetchInviteRequests = async () => {
    //         if(!user){
    //             return
    //         }
    //         try {
    //             const response = await fetch(`/api/group/invite`, {
    //                 headers: {'Authorization': `Bearer ${user.token}`},
    //             })
    //             const json = await response.json()
    //             if(!response.ok){
    //                 setError(json.message)
    //             } else {
    //                 setInviteRequests(json);
    //             }
    //         } catch (error) {
    //             setError("Failed to fetch invite requests")
    //         } finally {
    //             setLoadingInvite(false)
    //         }
    //     }

    //     const fetchJoinRequests = async () => {
    //         if(!user){
    //             return
    //         }
    //         try {
    //             const response = await fetch(`/api/group/request`, {
    //                 headers: {'Authorization': `Bearer ${user.token}`},
    //             })
    //             const json = await response.json()
    //             if(!response.ok){
    //                 setRequestError(json.message)
    //             } else {
    //                 setJoinRequests(json);
    //             }
    //         } catch (error) {
    //             setRequestError("Failed to fetch join requests")
    //         } finally {
    //             setLoadingRequests(false)
    //         }
    //     }

    //     fetchInviteRequests()
    //     fetchJoinRequests()
    // }, [user])

    let inviteContainer, requestContainer;

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

        const handleAddUserSubmit = async (userIDToAdd) => {
            if (!user) return;
    
            try {
                // // Fetch the user ID based on the username to add
                // const response = await fetch(`/api/user/search/` + usernameToAdd, {
                //     headers: { 'Authorization': `Bearer ${user.token}` }
                // });
    
                // const json = await response.json();
                // if (json.length === 0) {
                //     throw new Error("User not found");
                // }
    
                // const userIDToAdd = json[0]._id;
    
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
                    setAddUserStatus({ success: true });
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

        const handleRevokeInviteSubmit = async (userIDToRevoke) => {
            if (!user) return;
    
            try {
                // Add the user to the group
                const responseAdd = await fetch(`/api/group/revoke/` + group._id, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({ user_id: userIDToRevoke })
                });
    
                const updatedGroup = await responseAdd.json();
                
                if (responseAdd.ok) {
                    // Dispatch the updated group which should include both membersID and pendingID
                    dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
                    groupPageContext.dispatch({ type: 'SET_GROUP', payload: updatedGroup });
                    setAddUserStatus({ success: true });
                } else {
                    console.error("Error revoke invite:", updatedGroup.error);
                    setAddUserStatus({ success: false, message: updatedGroup.error });
                }
            } catch (error) {
                console.error("Failed to revoke invite:", error);
                setAddUserStatus({ success: false, message: error.message });
            }
        };

        let pendingInvites;
        
        if (group != null && group.pendingID.length > 0) {
            pendingInvites = (
                <div>
                    <h2>Pending Invitations</h2>
                    <div className="search-results">
                        <ul className="members">
                            {group.pendingID.map(user => (
                                <div className="search-result">
                                    <Member group={group} member={user} isInvite={true} handleRevokeInviteSubmit={handleRevokeInviteSubmit}/>
                                    {/* <button className="delete-btn" onClick={() => handleRevokeInviteSubmit(user._id)}>Revoke</button> */}
                                </div>
                            ))}
                        </ul>
                    </div>
                </div>
            )
        }
        
        inviteContainer = (
            <div>
                {pendingInvites}
                <h2>Invite User</h2>
                <form onSubmit={handleSearchSubmit}>
                    <div className="search-user">
                        <input
                            type="text"
                            value={usernameToAdd}
                            onChange={(e) => setUsernameToAdd(e.target.value)}
                            placeholder="Enter username here..."
                        />
                        <button className="add-btn">Search</button>
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
                                    <ul className="members">
                                        <Member group={group} member={user} isSearchInvite={true} handleAddUserSubmit={handleAddUserSubmit}/>
                                        {/* {group.pendingID.findIndex((u) => u._id == user._id) < 0 && <button className="add-btn" onClick={() => handleAddUserSubmit(user._id)}>Invite</button>}
                                        {group.pendingID.findIndex((u) => u._id == user._id) >= 0 && <div>Invite sent!</div>} */}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </form>
                {addUserStatus && addUserStatus.message && (
                    <div className={`status-message ${addUserStatus.success ? 'success' : 'error'}`}>
                        {addUserStatus.message}
                    </div>
                )}
            </div>
        )

        const joinRequests = group.requestID
        if (joinRequests.length > 0) {
            requestContainer = (
                <div>
                    <h2>Requesting to Join</h2>
                    {joinRequests.map(user => (
                        <div className="search-result">
                            <ul className="members">
                                <Member group={group} member={user} isRequest={true} handleApproveRequest={handleApproveRequest} handleRejectRequest={handleRejectRequest}/>
                                {/* <div className="kick-actions">
                                    <button className="add-btn" onClick={() => handleApproveRequest(user)}>Accept</button>
                                    <button className="delete-btn" onClick={() => handleRejectRequest(user)}>Deny</button>
                                </div> */}
                            </ul>
                        </div>
                    ))}
                    {requestActionStatus && requestActionStatus.message && (
                        <div className={`status-message ${requestActionStatus.success ? 'success' : 'error'}`}>
                            {requestActionStatus.message}
                        </div>
                    )}
                </div>
            )
        } else {
            requestContainer = (
                <div/>
            )
        }
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
                {requestContainer}
                {inviteContainer}
            </div>
        </div>
    )
}

export default MembersModal