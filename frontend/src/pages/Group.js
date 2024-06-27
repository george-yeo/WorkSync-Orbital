import { useEffect, useState } from "react";
import { useGroupContext } from "../hooks/useGroupContext";
import { useAuthContext } from "../hooks/useAuthContext";
import Modal from 'react-modal';

import GroupForm from "../components/GroupForm";
import Request from "../components/Request";

const Group = () => {
    const { groups, dispatch } = useGroupContext();
    const { user } = useAuthContext();
    const [addUserStatus, setAddUserStatus] = useState(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isRemoveUserModalOpen, setIsRemoveUserModalOpen] = useState(false);
    const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
    const [usernameToAdd, setUsernameToAdd] = useState('');
    const [usernameToRemove, setUsernameToRemove] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [groupToDelete, setGroupToDelete] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            if (!user) return;

            try {
                const response = await fetch(`/api/group`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });

                const json = await response.json();

                if (response.ok) {
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
    };

    // Handle Add User Form Submit
    const handleAddUserSubmit = async (e) => {
        e.preventDefault();
        if (!user || !usernameToAdd) return;

        try {
            const response = await fetch(`/api/user/search/` + usernameToAdd, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            const json = await response.json();
            if (!response.ok) {
                throw new Error("Error finding user: " + json.message);
            }

            const userIDToAdd = json[0]._id;

            const responseAdd = await fetch(`api/group/add/` + selectedGroupId, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ username: usernameToAdd, user_id: userIDToAdd })
            });

            const updatedGroup = await responseAdd.json();
            if (responseAdd.ok) {
                dispatch({ type: 'SET_GROUPS', payload: groups.map(group => group._id === selectedGroupId ? updatedGroup : group) });
                setAddUserStatus({ success: true, message: "User added successfully!" });
            } else {
                console.error("Error adding user to group:", updatedGroup.error);
                setAddUserStatus({ success: false, message: updatedGroup.error });
            }
        } catch (error) {
            console.error("Failed to add user to group:", error);
            setAddUserStatus({ success: false, message: error.message });
        } finally {
            setIsAddUserModalOpen(false);
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

            console.log(userIDToRemove)

            // Remove the user from the group
            const responseRemove = await fetch(`api/group/remove/` + selectedGroupId, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ username: usernameToRemove, user_id: userIDToRemove })
            });

            const updatedGroup = await responseRemove.json();
            if (responseRemove.ok) {
                dispatch({ type: 'SET_GROUPS', payload: updatedGroup });
                window.location.reload()
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
    const handleDeleteGroupClick = (groupId) => {
        setGroupToDelete(groupId);
        setIsDeleteGroupModalOpen(true);
    };

    const handleDeleteGroupSubmit = async () => {
        if (!user || !groupToDelete) return;

        try {
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

    return (
        <div className="groups">   
            <div className="groups-list">
                <GroupForm onGroupCreated={(newGroup) => dispatch({ type: 'CREATE_GROUP', payload: newGroup })} />
                {groups ? (
                    groups.length > 0 ? (
                        groups.map((group) => (
                            <div className="group-item" key={group._id}>
                                <h2>{group.name}</h2>
                                <p><b>Members:</b> {group.members.map((member) => (
                                    <p><span key={member}>
                                        {member} 
                                        <button className="remove-btn" onClick={() => handleRemoveUserClick(group._id, member)}>Remove</button>
                                    </span></p>
                                ))}
                                </p>
                                <p><b>Pending:</b> {group.pending.join(", ")}</p>
                                <button className="add-btn" onClick={() => handleAddUserClick(group._id)}>Add User</button>
                                <button className="delete-btn" onClick={() => handleDeleteGroupClick(group._id)}>Delete Group</button>
                            </div>
                        ))
                    ) : (
                        <p>No groups to display</p>
                    )
                ) : (
                    <p>Loading groups...</p>
                )}
            </div>
            <div className="request-list">
                <Request />
            </div>

            {/* Add User Modal */}
            <Modal
                isOpen={isAddUserModalOpen}
                onRequestClose={() => setIsAddUserModalOpen(false)}
                contentLabel="Add User to Group"
                className="addUser-popup-form"
                overlayClassName="custom-modal-overlay"
                ariaHideApp={false}
            >
                <h2>Add User to Group</h2>
                <form onSubmit={handleAddUserSubmit}>
                    <label>
                        Username:
                        <input
                            type="text"
                            value={usernameToAdd}
                            onChange={(e) => setUsernameToAdd(e.target.value)}
                            required
                        />
                    </label>
                    <div className="modal-buttons">
                        <button type="submit">Add User</button>
                        <button type="button" onClick={() => setIsAddUserModalOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>

            {/* Remove User Confirmation Modal */}
            <Modal
                isOpen={isRemoveUserModalOpen}
                onRequestClose={() => setIsRemoveUserModalOpen(false)}
                contentLabel="Confirm Remove User"
                className="removeUser-popup-form"
                ariaHideApp={false}
            >
                <h2>Confirm Remove Member</h2>
                <p>Are you sure you want to remove <strong>{usernameToRemove}</strong> from the group?</p>
                <div className="modal-buttons">
                    <button onClick={handleRemoveUserSubmit}>Yes, Remove</button>
                    <button onClick={() => setIsRemoveUserModalOpen(false)}>Cancel</button>
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
                <p>Are you sure you want to delete this group?</p>
                <div className="modal-buttons">
                    <button onClick={handleDeleteGroupSubmit}>Yes, Delete</button>
                    <button onClick={() => setIsDeleteGroupModalOpen(false)}>Cancel</button>
                </div>
            </Modal>
        </div>
    );
};

export default Group;