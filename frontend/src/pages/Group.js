import { useEffect, useState } from "react";
import { useGroupContext } from "../hooks/useGroupContext";
import { useAuthContext } from "../hooks/useAuthContext";

import GroupForm from "../components/GroupForm";
import Request from "../components/Request";

const Group = () => {
    const { groups, dispatch } = useGroupContext();
    const { user } = useAuthContext();
    const [addUserStatus, setAddUserStatus] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            if (!user) return;
    
            try {
                const response = await fetch(`/api/group`, {
                    headers: {'Authorization': `Bearer ${user.token}`},
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


    const handleAddUser = async (groupId) => {
        if (!user) return;

        try {
            const usernameToAdd = prompt("Enter username to add to the group:");

            if (!usernameToAdd) return

            const response = await fetch(`/api/user/search/` + usernameToAdd, {
                headers: {'Authorization': `Bearer ${user.token}`}
            });

            const json = await response.json()

            const userIDToAdd = json[0]._id

            if (!response.ok) {
                throw new Error("Error finding user:", json.message)
            }

            const responseAdd = await fetch(`api/group/add/` + groupId, {
                method:'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({username: usernameToAdd, user_id: userIDToAdd})
            })
            const updatedGroup = await responseAdd.json();
            if (responseAdd.ok) {
                dispatch({ type: 'SET_GROUPS', payload: groups.map(group => group._id === groupId ? updatedGroup : group) });
            } else {
                console.error("Error adding user to group:", updatedGroup.error);
                setAddUserStatus({ success: false, message: updatedGroup.error });
            }
        } catch (error) {
            console.error("Failed to add user to group:", error);
            setAddUserStatus({ success: false, message: error.message });
        }
    };

    return (
        <div className="groups">
            <GroupForm onGroupCreated={(newGroup) => dispatch({ type: 'CREATE_GROUP', payload: newGroup })} />
            <div className="groups-list">
                {groups ? (
                    groups.length > 0 ? (
                        groups.map((group) => (
                            <div className="group-item">
                                <h3>{group.name}</h3>
                                <h4>Members: {group.members.join(", ")}</h4>
                                <h4>Pending: {group.pending.join(", ")}</h4>
                                <button onClick={() => handleAddUser(group._id)}>Add User</button>
                            </div>
                        ))
                    ) : (
                        <p>No groups to display</p>
                    )
                ) : (
                    <p>Loading groups...</p>
                )}
            </div>
            <Request/>
        </div>
    );
};

export default Group;
