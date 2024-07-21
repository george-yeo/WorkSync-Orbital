import { useEffect, useState } from "react";
import { useGroupContext } from "../hooks/useGroupContext";
import { useAuthContext } from "../hooks/useAuthContext";
import Modal from 'react-modal';

import GroupForm from "../components/GroupForm";
import GroupItem from "../components/GroupItem";
import Request from "../components/Request";
import JoinGroup from "../components/JoinGroup";

const Group = () => {
    const { groups, searchResults, dispatch } = useGroupContext();
    const { user } = useAuthContext();
    const [addUserStatus, setAddUserStatus] = useState(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [isRemoveUserModalOpen, setIsRemoveUserModalOpen] = useState(false);
    const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
    const [usernameToAdd, setUsernameToAdd] = useState('');
    const [usernameToRemove, setUsernameToRemove] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [sectionToDelete, setSectionToDelete] = useState(null);
    //const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        const fetchGroups = async () => {
            if (!user) return;

            try {
                const response = await fetch(`/api/group`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });

                const json = await response.json();

                if (response.ok) {
                    console.log(json)
                    dispatch({ type: 'SET_GROUPS', payload: json });
                } else {
                    console.error("Error fetching groups:", json.message);
                }
            } catch (error) {
                console.error("Failed to fetch groups:", error);
            }
        };

        if (user) {
            fetchGroups();
        }
    }, [user, dispatch]);

    // Handle Add User Button Click
    const handleAddUserClick = (groupId) => {
        setSelectedGroupId(groupId);
        setIsAddUserModalOpen(true);
        setAddUserStatus(null);
        //setSearchResults([])
    };

    // Handle Add User Form Submit
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
            const responseAdd = await fetch(`/api/group/add/` + selectedGroupId, {
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
                setIsAddUserModalOpen(false);
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


    // Handle Remove User Button Click
    const handleRemoveUserClick = (groupId, username) => {
        setSelectedGroupId(groupId);
        setUsernameToRemove(username);
        setIsRemoveUserModalOpen(true);
    };

    // Handle Remove User Confirmation
    const handleRemoveUserSubmit = async () => {
        if (!user || !usernameToRemove) return;

        try {
            // Fetch the user to get their ID
            const response = await fetch(`/api/user/search/` + usernameToRemove, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            const json = await response.json();
            if (!response.ok) {
                throw new Error("Error finding user: " + json.message);
            }

            const userIDToRemove = json[0]._id;

            // Remove the user from the group
            const responseRemove = await fetch(`api/group/remove/` + selectedGroupId, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ user_id: userIDToRemove })
            });

            const updatedGroup = await responseRemove.json();
            if (responseRemove.ok) {
                dispatch({ type: 'SET_GROUPS', payload: updatedGroup });
                if (user._id === userIDToRemove){
                    window.location.reload()
                } 
            } else {
                console.error("Error removing user from group:", updatedGroup.error);
            }
        } catch (error) {
            console.error("Failed to remove user from group:", error);
        } finally {
            setIsRemoveUserModalOpen(false);
            setUsernameToRemove('');
        }
    };

    // Handle Delete Group Button Click
    const handleDeleteGroupClick = (groupId, sectionID) => {
        setGroupToDelete(groupId);
        setSectionToDelete(sectionID)
        setIsDeleteGroupModalOpen(true);
    };

    const handleDeleteGroupSubmit = async () => {
        if (!user || !groupToDelete || !sectionToDelete) return;

        try {
            const responseDelete = await fetch(`/api/group/${sectionToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            })

            if (!responseDelete.ok) {
                console.error("Failed to delete group:", responseDelete.statusText);
            }

            // Send DELETE request to API to delete the group
            const response = await fetch(`/api/group/delete/` + groupToDelete, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (response.ok) {
                // Remove the group from the state
                dispatch({ type: 'DELETE_GROUP', payload: groupToDelete });
                setIsDeleteGroupModalOpen(false);
                window.location.reload()
            } else {
                console.error("Failed to delete group:", response.statusText);
            }
        } catch (error) {
            console.error("Failed to delete group:", error);
        }
    };

    // const handleSearchSubmit = async (e) => {
    //     e.preventDefault();
    //     if (!user || !usernameToAdd) return;

    //     try {
    //         const response = await fetch(`/api/user/search/${usernameToAdd}`, {
    //             headers: { 'Authorization': `Bearer ${user.token}` }
    //         });

    //         const json = await response.json();

    //         if (response.ok) {
    //             setSearchResults(json);
    //         } else {
    //             console.error("Error searching user:", json.message);
    //         }
    //     } catch (error) {
    //         console.error("Failed to search user:", error);
    //     }
    // };

    let groupsList
    if (groups == null) {
        groupsList = (
            <div>
                Loading groups...
            </div>
        )
    } else if (groups && searchResults == null) {
        groupsList = groups.length > 0 ? (
            groups.map((group) => (
                <GroupItem group={group}/>
            ))
        ) : (
            <p>No groups to display</p>
        )
    } else if (searchResults) {
        groupsList = searchResults.length > 0 ? (
            searchResults.map((group) => (
                <GroupItem group={group}/>
            ))
        ) : (
            <p>No groups to display</p>
        )
    }

    return (
        <div className="groups">
            <div className="groups-header">
                {searchResults == null && <div className="top">
                    <h1>My Groups</h1>
                    <button className="create add-btn" onClick={()=>setIsAddGroupModalOpen(true)}>
                        Create
                        <span className="material-symbols-outlined">create</span>
                    </button>
                    <GroupForm isOpen={isAddGroupModalOpen} setIsOpen={setIsAddGroupModalOpen} onGroupCreated={(newGroup) => dispatch({ type: 'CREATE_GROUP', payload: newGroup })} />
                </div>}
                {searchResults != null && <div className="top">
                    <h1>Search Results</h1>
                </div>}
                <JoinGroup/>
            </div>
            <div className="groups-list">
                {/* <GroupForm onGroupCreated={(newGroup) => dispatch({ type: 'CREATE_GROUP', payload: newGroup })} /> */}
                {groupsList}
            </div>
            <div className="request-list">
                <Request />
            </div>

            {/* Remove User Confirmation Modal */}
            <Modal
                isOpen={isRemoveUserModalOpen}
                onRequestClose={() => setIsRemoveUserModalOpen(false)}
                contentLabel="Confirm Remove User"
                className="removeUser-popup-form"
                ariaHideApp={false}
            >
                <h2>Confirm Remove Member</h2>
                <span className="close-btn" onClick={() => setIsRemoveUserModalOpen(false)}>&times;</span>
                <p>Are you sure you want to remove <strong>{usernameToRemove}</strong> from the group?</p>
                <div className="modal-buttons">
                    <button onClick={handleRemoveUserSubmit}>Yes, Remove</button>
                </div>
            </Modal>

             {/* Delete Group Confirmation Modal */}
             <Modal
                isOpen={isDeleteGroupModalOpen}
                onRequestClose={() => setIsDeleteGroupModalOpen(false)}
                contentLabel="Confirm Delete Group"
                className="deleteGroup-popup-form"
                ariaHideApp={false}
            >
                <h2>Confirm Delete Group</h2>
                <span className="close-btn" onClick={() => setIsDeleteGroupModalOpen(false)}>&times;</span>
                <p>Are you sure you want to delete this group?</p>
                <div className="modal-buttons">
                    <button onClick={handleDeleteGroupSubmit}>Yes, Delete</button>
                </div>
            </Modal>
        </div>
    );
};

export default Group;

// {/* Add User Modal */}
// <Modal
// isOpen={isAddUserModalOpen}
// onRequestClose={() => setIsAddUserModalOpen(false)}
// contentLabel="Add User to Group"
// className="addUser-popup-form"
// overlayClassName="custom-modal-overlay"
// ariaHideApp={false}
// >
// <h2>Add User to Group</h2>
// <span className="close-btn" onClick={() => setIsAddUserModalOpen(false)}>&times;</span>
// <form onSubmit={handleSearchSubmit}>
//     <label>
//         Username:
//         <input
//             type="text"
//             value={usernameToAdd}
//             onChange={(e) => setUsernameToAdd(e.target.value)}
//             required
//         />
//     </label>
//     <div className="modal-buttons">
//         <button type="submit">Search</button>
//     </div>
// </form>

// {/* Display search results */}
// {searchResults.length > 0 && (
//     <div className="search-results">
//         <h3>Search Results:</h3>
//         <div>
//             {searchResults.map(user => (
//                 <p key={user._id}>
//                     {user.username}
//                     <button className="join-group-btn" onClick={() => handleAddUserSubmit(user.username)}>Add</button>
//                 </p>
//             ))}
//         </div>
//     </div>
// )}
// {addUserStatus && (
//     <div className={`status-message ${addUserStatus.success ? 'success' : 'error'}`}>
//         {addUserStatus.message}
//     </div>
// )}
// </Modal>