const Group = require('../models/Group')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

//create new group
const createGroup = async (req, res) => {
    const {name, createdBy, createdByID} = req.body
    try {      
        const group = await Group.createGroup(name, createdBy, createdByID)
        res.status(200).json(group)
    } catch(error) {
        res.status(400).json({error: error.message})
    }
}

//add user
const addUser = async (req, res) => {
    const { id } = req.params
    const { username, user_id } = req.body

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.pendingID.some(pendingUser => pendingUser.equals(user_id));
    if (isUserPending) {
        return res.status(400).json({ error: "User is already in the pending list." });
    }

    const isUserMember = group.membersID.some(member => member.equals(user_id))
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            {$push: { pendingID: user_id}}
        )
        await Group.updateOne(
            { _id: id},
            {$push: { pending: username}}
        )
        res.status(200).json(await Group.findById(id))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

//accept invite
const acceptGroup = async (req, res) => {
    const { id } = req.params
    const { username, user_id } = req.body

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.pendingID.some(pendingUser => pendingUser.equals(user_id));
    if (!isUserPending) {
        return res.status(400).json({ error: "User is not in the pending list." });
    }

    const isUserMember = group.membersID.some(member => member.equals(user_id))
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            { $pull: { pendingID: user_id}},
            { $pull: { pending: username}}
        )
        await Group.updateOne(
            { _id: id},
            { $pull: { pending: username}}
        )
        await Group.updateOne(
            { _id: id},
            { $push: { membersID: user_id}},
            { $push: { members: username}}
        )
        await Group.updateOne(
            { _id: id},
            { $push: { members: username}}
        )
        res.status(200).json(await Group.find({_id: id }))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

//reject group
const rejectGroup = async (req, res) => {
    const { id } = req.params
    const { username, user_id } = req.body

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.pendingID.some(pendingUser => pendingUser.equals(user_id));
    if (!isUserPending) {
        return res.status(400).json({ error: "User is not in the pending list." });
    }

    const isUserMember = group.membersID.some(member => member.equals(user_id))
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            { $pull: { pendingID: user_id}}
        )
        await Group.updateOne(
            { _id: id},
            { $pull: { pending: username}}
        )
        res.status(200).json(await Group.find({_id: id }))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

//get group
const getAllGroups = async (req, res) => {
    const user_id = req.user._id

    const groups = await Group.find({ membersID: {$all: user_id} }).sort({"createdAt": 1})

    res.status(200).json(groups)
}

//get request
const getRequest = async (req, res) => {
    const user_id = req.user._id
    const groups = await Group.find({ pendingID: {$all: user_id} }).sort({"createdAt": 1})
    res.status(200).json(groups)
}

//remove member
const removeMember = async (req, res) => {
    const { id } = req.params
    const { username, user_id } = req.body

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserMember = group.membersID.some(member => member.equals(user_id))
    if (!isUserMember) {
        return res.status(400).json({ error: "User is not a member." });
    }

    const isUserLeader = group.createdByID.equals(user_id)
    if (isUserLeader) {
        return res.status(400).json({ error: "User is the leader." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            { $pull: { membersID: user_id}}
        )
        await Group.updateOne(
            { _id: id},
            { $pull: { members: username}}
        )
        res.status(200).json(await Group.find({_id: id }))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// delete a group
const deleteGroup = async (req, res) => {
    const { id } = req.params

    const group = await Group.findOneAndDelete({_id: id})

    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    res.status(200).json(group)
}

module.exports = {createGroup, addUser, acceptGroup, getAllGroups, getRequest, rejectGroup, removeMember, deleteGroup}