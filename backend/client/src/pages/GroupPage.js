import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGroupPageContext } from "../hooks/useGroupPageContext";
import { useSectionContext } from "../hooks/useSectionContext";
import { useTaskContext } from "../hooks/useTaskContext";
import { useAuthContext } from "../hooks/useAuthContext";
import Modal from 'react-modal';

import Section from "../components/Section";
import MembersModal from "../components/group-page/MembersModal";
import CommentModal from "../components/group-page/CommentModal";
import ManageGroupModal from "../components/group-page/ManageGroupModal";
import LeaveGroupModal from "../components/group-page/LeaveGroupModal";

const GroupPage = () => {
    const { id: groupId } = useParams()
    const { user } = useAuthContext();
    const groupPageContext = useGroupPageContext();
    const sectionContext = useSectionContext();
    const taskContext = useTaskContext();
    const [isMembersOpen, setIsMembersOpen] = useState(false)
    const [isCommentOpen, setIsCommentOpen] = useState(false)
    const [isManageOpen, setIsManageOpen] = useState(false)
    const [isLeaveOpen, setIsLeaveOpen] = useState(false)
    
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
    let canManage = false
    let isOwner = false
    if (group) {
        if (group.treeGrowthProgress >= 50) {
            growthPic = "sapling"
        }
        canManage = group.createdByID._id == user._id
        isOwner = group.createdByID._id == user._id
    }

    let sectionContainer;
    if (group) {
        const section = sectionContext.sections.find(section => section.group_id === group._id)
        if (section) {
            sectionContainer = (
                <Section section={section} tasks={taskContext.tasks} key={section._id} group_id={group._id} canManage={canManage} />
            )
        } else {
            sectionContainer = (
                <div className="group-section">
                    <h1>Tasks for Group</h1>
                    Tasks could not be loaded...
                </div>
            )
        }
    }
    
    return (
        group ?
        <div className="group-page">
            <div className="contents">
                <img className="group-pic"
                src= {`data:image/jpeg;base64, ${group.groupPic}`}  
                alt="Channel Picture" 
                />
                <h1>{group.name}</h1>
                {group.isGrowingTree == false && <button className="add-btn" onClick={handleOnClickPlantTree}>Plant a Tree!</button>}
                <div className="synctree">
                    <h3>{"SyncTrees Grown: " + group.treesGrown}</h3>
                    {group.isGrowingTree == true && <h3>{"Growth - " + group.treeGrowthProgress + "%"}</h3>}
                    {group.isGrowingTree == false && group.treesGrown > 0 && <img className="tree" src="../tree.png"></img>}
                    {group.isGrowingTree == true && <img className={growthPic} src={"../"+growthPic+".png"}></img>}
                    {group.selectedComment && <div className="comment">
                        <img src="../sign.png" />
                        <div className="message">{group.selectedComment.message}</div>
                        <div className="sender">-{group.selectedComment.sender.displayname}</div>
                    </div>}
                    <img className="soil" src="../soil.png"></img>
                </div>
                <div className="group-actions">
                    <button className="add-btn" onClick={()=>setIsMembersOpen(!isMembersOpen)}>View Members</button>
                    <button className="add-btn" onClick={()=>setIsCommentOpen(!isCommentOpen)}>Add Comment</button>
                    {canManage && <button className="add-btn" onClick={()=>setIsManageOpen(!isManageOpen)}>Manage Group</button>}
                    {!isOwner && <button className="red-btn" onClick={()=>setIsLeaveOpen(!isLeaveOpen)}>Leave Group</button>}
                </div>
            </div>
            {sectionContainer}
            <MembersModal isOpen={isMembersOpen} setIsMembersOpen={setIsMembersOpen} canManage={canManage} />
            <CommentModal isOpen={isCommentOpen} setIsCommentOpen={setIsCommentOpen} />
            {canManage && <ManageGroupModal isOpen={isManageOpen} setIsManageOpen={setIsManageOpen} isOwner={isOwner} />}
            {!isOwner && <LeaveGroupModal isOpen={isLeaveOpen} setIsLeaveOpen={setIsLeaveOpen} />}
        </div> :
        <div></div>
    );
};

export default GroupPage;