import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGroupPageContext } from "../hooks/useGroupPageContext";
import { useAuthContext } from "../hooks/useAuthContext";
import Modal from 'react-modal';

//import GroupDetail from "../components/GroupDetail";

const GroupPage = () => {
    const { id: groupId } = useParams()
    const { user } = useAuthContext();
    const groupPageContext = useGroupPageContext();
    
    useEffect(() => {
        const fetchGroupDetail = async () => {
            if (!user || !groupId) return;

            try {
                const response = await fetch(`/api/group/` + groupId, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });

                const json = await response.json();
                
                if (response.ok) {
                    groupPageContext.dispatch({ type: 'SET_GROUP', payload: json });
                } else {
                    console.error("Error fetching group:", json.message);
                }
            } catch (error) {
                console.error("Failed to fetch group:", error);
            }
        };

        if (user) {
            fetchGroupDetail();
        }
    }, [user]);

    const group = groupPageContext.group

    const handleOnClickPlantTree = async () => {
        try {
            const response = await fetch(`/api/group/plant-tree/` + groupId, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
            });

            const json = await response.json();
            console.log(json)
            if (response.ok) {
                if (json) {
                    groupPageContext.dispatch({ type: 'PLANT_TREE', payload: json });
                }
            } else {
                console.error("Error fetching group:", json.message);
            }
        } catch (error) {
            console.error("Failed to fetch group:", error);
        }
    }

    let growthPic = "sprout"
    if (group && group.treeGrowthProgress > 50) {
        growthPic = "sapling"
    }

    return (
        group ?
        <div className="group-page">
            <h1>{group.name}</h1>
            {group.isGrowingTree == false && <button className="add-btn" onClick={handleOnClickPlantTree}>Plant a Tree!</button>}
            <div className="synctree">
                <h3>{"SyncTrees Grown: " + group.treesGrown}</h3>
                {group.isGrowingTree == true && <h3>{"Growth - " + group.treeGrowthProgress + "%"}</h3>}
                {group.isGrowingTree == false && group.treesGrown > 0 && <img className="tree" src="../tree.png"></img>}
                {group.isGrowingTree == true && <img className="tree" src={"../"+growthPic+".png"}></img>}
                <img className="soil" src="../soil.png"></img>
            </div>
            <div className="group-actions">
                <button className="add-btn" >View Members</button>
                <button className="add-btn">Add Comment</button>
                {group.createdByID._id == user._id && <button className="add-btn">Manage Group</button>}
            </div>
        </div> :
        <div></div>
    );
};

export default GroupPage;