const Group = require('../models/Group')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const validator = require('validator')

//create new group
const createGroup = async (req, res) => {
    const { name, sectionID } = req.body
    const createdByID = req.user._id

    const user = await User.findById(createdByID)
    if (!user) return res.status(404).json({ error: "User not found" })

    try {      
        const group = await Group.createGroup(name, user, sectionID)
        res.status(200).json(await group.getSafeData())
    } catch(error) {
        console.log(error.message)
        res.status(400).json({error: error.message})
    }
}

//add user
const addUser = async (req, res) => {
    const { id } = req.params
    const { user_id } = req.body
    
    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.pendingID.some(pendingUser => pendingUser.equals(user_id));
    if (isUserPending) {
        return res.status(400).json({ error: "User is already in the pending list." });
    }

    const isUserRequest = group.requestID.some(requestUser => requestUser.equals(user_id));
    if (isUserRequest) {
        return res.status(400).json({ error: "User is already in the request list." });
    }

    const isUserMember = await group.isMember(user_id)
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    const canManage = group.canManage(req.user._id)
    if (!canManage) {
        return res.status(400).json({ error: "User has no privileges." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            {$push: { pendingID: user_id}}
        )
        res.status(200).json(await (await Group.findById(id)).getSafeData())
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

//accept invite
const acceptGroup = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.pendingID.some(pendingUser => pendingUser.equals(user_id));
    if (!isUserPending) {
        return res.status(400).json({ error: "User is not in the pending list." });
    }

    const isUserMember = await group.isMember(user_id)
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    try {
        await group.addMember(user_id)
        console.log(group.membersID)
        res.status(200).json(await group.getSafeData())
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

//reject group
const rejectGroup = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.pendingID.some(pendingUser => pendingUser.equals(user_id));
    if (!isUserPending) {
        return res.status(400).json({ error: "User is not in the pending list." });
    }

    const isUserMember = await group.isMember(user_id)
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    const isUserOwner = group.createdByID.equals(user_id)
    if (isUserOwner) {
        return res.status(400).json({ error: "User is the owner." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            { $pull: { pendingID: user_id}}
        )
        res.status(200).json(true)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

//get group
const getAllGroups = async (req, res) => {
    const user_id = req.user._id

    const groups = await Group.find({
        $or: [
          { membersID: { $all: [user_id] } },
          { createdByID: user_id },
          { requestID: { $all: [user_id] } },
        ]
      })
      .sort({ "createdAt": 1 })
      .exec()
    
    let groupsData = []
    await Promise.all(await groups.map(group => {
        return new Promise(async (resolve, reject) => {
            groupsData.push(await group.getSafeData())
            resolve()
        })
    }))
    
    res.status(200).json(groupsData)
}

//get invite
const getInvite = async (req, res) => {
    const user_id = req.user._id
    const groups = await Group.find({ pendingID: {$all: user_id} }).sort({"createdAt": 1})
    
    let groupsData = []
    await Promise.all(await groups.map(group => {
        return new Promise(async (resolve, reject) => {
            groupsData.push(await group.getSafeData())
            resolve()
        })
    }))
    
    res.status(200).json(groupsData)
}

//remove member
const removeMember = async (req, res) => {
    const { id } = req.params
    const { user_id } = req.body
    
    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserMember = await group.isMember(user_id)
    if (!isUserMember) {
        return res.status(400).json({ error: "User is not a member." });
    }

    const isUserOwner = group.createdByID.equals(user_id)
    if (isUserOwner) {
        return res.status(400).json({ error: "User is the owner." });
    }

    const canManage = group.canManage(req.user._id)
    if (!canManage) {
        return res.status(400).json({ error: "User has no privileges." });
    }

    try {
        await group.removeMember(user_id)
        res.status(200).json(await group.getSafeData())
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// delete a group
const deleteGroup = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id

    const group = await Group.findOne({
        _id: id,
        createdByID: user_id,
    })

    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    } else {
        if (!group.createdByID.equals(user_id)) {
            return res.status(400).json({ error: "User does not have privileges." });
        }

        await Group.findOneAndDelete({
            _id: id,
            createdByID: user_id,
        })
        await Group.model('ChatChannel').findOneAndDelete({ _id: group.chatChannelID })
        await Group.model('TaskSection').deleteMany({ group_id: group._id })
    }

    res.status(200).json(group)
}

//search group
const searchGroup = async (req, res) => {
    try {
        const { group: name } = req.params

        const groups = await Group.findGroupByName(name)
        
        let groupsData = []
        await Promise.all(await groups.map(group => {
            return new Promise(async (resolve, reject) => {
                groupsData.push(await group.getSafeData())
                resolve()
            })
        }))

        res.status(200).json(groupsData)
    } catch (error) {
        console.log("searchGroup error: ", error.message)
        res.status(500).json({error: error.message})
    }
}

const joinGroup = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.pendingID.some(pendingUser => pendingUser.equals(user_id));
    if (isUserPending) {
        return res.status(400).json({ error: "User is already in the pending list." });
    }

    const isUserRequest = group.requestID.some(requestUser => requestUser.equals(user_id));
    if (isUserRequest) {
        return res.status(400).json({ error: "User is already in the pending list." });
    }

    const isUserMember = await group.isMember(user_id)
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    const isUserOwner = group.createdByID.equals(user_id)
    if (isUserOwner) {
        return res.status(400).json({ error: "User is the owner." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            {$push: { requestID: user_id}}
        )
        res.status(200).json(true)
    } catch (error) {
        console.log(error.message)
        res.status(400).json({error: error.message})
    }
}

const revokeInvite = async (req, res) => {
    const { id } = req.params
    const { user_id } = req.body

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.pendingID.some(pendingUser => pendingUser.equals(user_id));
    if (!isUserPending) {
        return res.status(400).json({ error: "User is not in the pending list." });
    }

    const canManage = group.canManage(req.user._id)
    if (canManage) {
        await Group.updateOne(
            { _id: id},
            { $pull: { pendingID: user_id}}
        )
        res.status(200).json(await (await Group.findById(id)).getSafeData())
    } else {
        return res.status(400).json({ error: "User has no privileges." });
    }
}

const cancelRequest = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }
    
    const isUserRequest = group.requestID.some(requestUser => requestUser.equals(user_id));
    if (!isUserRequest) {
        return res.status(400).json({ error: "User is not in the request list." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            { $pull: { requestID: user_id}}
        )
        res.status(200).json(await group.getSafeData())
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const leaveGroup = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }
    
    if (await group.isMember(user_id) && !(await group.isOwner(user_id))) {
        await group.removeMember(user_id)
        res.status(200).json(true)
    } else {
        return res.status(400).json({ error: "User is not a member or the owner." });
    }
}

const getRequest = async (req, res) => {
    const user_id = req.user._id
    const groups = await Group.find({
        $and: [
          { requestID: { $ne: [] } },
          { createdByID: user_id }
        ]
      })
      .sort({ "createdAt": 1 })
    
    let groupsData = []
    await Promise.all(await groups.map(group => {
        return new Promise(async (resolve, reject) => {
            groupsData.push(await group.getSafeData())
            resolve()
        })
    }))
      
    res.status(200).json(groupsData)
}

const acceptUser = async (req, res) => {
    const { id } = req.params
    const { user_id } = req.body

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.requestID.some(pendingUser => pendingUser.equals(user_id));
    if (!isUserPending) {
        return res.status(400).json({ error: "User is not in the pending list." });
    }

    const isUserMember = await group.isMember(user_id)
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    const canManage = group.canManage(req.user._id)
    if (!canManage) {
        return res.status(400).json({ error: "User has no privileges." });
    }

    try {
        await group.addMember(user_id)
        res.status(200).json(true)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const rejectUser = async (req, res) => {
    const { id } = req.params
    const { user_id } = req.body

    const group = await Group.findById(id)
    if (!group) {
        return res.status(404).json({ error: "Group not found." });
    }

    const isUserPending = group.requestID.some(pendingUser => pendingUser.equals(user_id));
    if (!isUserPending) {
        return res.status(400).json({ error: "User is not in the pending list." });
    }

    const isUserMember = await group.isMember(user_id)
    if (isUserMember) {
        return res.status(400).json({ error: "User is already a member." });
    }

    const canManage = group.canManage(req.user._id)
    if (!canManage) {
        return res.status(400).json({ error: "User has no privileges." });
    }

    try {
        await Group.updateOne(
            { _id: id},
            { $pull: { requestID: user_id}}
        )
        res.status(200).json(true)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const getGroupData = async (req, res) => {
    const user_id = req.user._id
    const { id } = req.params

    try {
        const group = await Group.findOne({
            _id: id,
            $or: [
                { membersID: { $all: [user_id] } },
                { createdByID: user_id }
            ]
        })

        if (group) {
            return res.status(200).json(await group.getSafeData())
        } else {
            return res.status(404).json("Group not found")
        }
    } catch (error) {
        console.log(error.message)
        res.status(400).json({error: error.message})
    }
}

const plantTree = async (req, res) => {
    const user_id = req.user._id
    const { id } = req.params

    try {
        let group = await Group.findOne({
            _id: id,
        })
        
        if (group && await group.isMember(user_id) && group.isGrowingTree == false) {
            group.isGrowingTree = true
            await group.save()
            return res.status(200).json(true)
        } else {
            return res.status(404).json("Group not found")
        }
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const setPrivacy = async (req, res) => {
    const user_id = req.user._id
    const { id } = req.params
    const { isPrivate } = req.body

    try {
        let group = await Group.findOne({
            _id: id,
        })

        if (!group) {
            return res.status(404).json("Group not found")
        }

        const canManage = group.canManage(req.user._id)
        if (!canManage) {
            return res.status(400).json({ error: "User has no privileges." });
        }
        
        group.isPrivate = isPrivate === true
        await group.save()
        return res.status(200).json(group.isPrivate)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const setName = async (req, res) => {
    const user_id = req.user._id
    const { id } = req.params
    const { name } = req.body

    try {
        let group = await Group.findOne({
            _id: id,
        })

        if (!group) {
            return res.status(404).json("Group not found")
        }

        const canManage = group.canManage(req.user._id)
        if (!canManage) {
            return res.status(400).json({ error: "User has no privileges." });
        }

        if (!validator.isAlphanumeric(name)) {
            return res.status(400).json({ error: 'Group name can only contain contains only letters and numbers (a-z A-Z 0-9)' });
        }
        if (!validator.isLength(name, { min: 4, max: 20 })) {
            return res.status(400).json({ error: 'Group name must be 4-20 characters long' });
        }
        
        const exist = await Group.findOne({ name: name })
        if (exist) {
            return res.status(400).json({ error: "Group name already in use" });
        }

        group.name = name
        await group.save()
        return res.status(200).json(group.name)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

module.exports = {
    createGroup,
    addUser,
    acceptGroup,
    getAllGroups,
    getInvite,
    rejectGroup,
    removeMember,
    leaveGroup,
    deleteGroup,
    searchGroup,
    joinGroup,
    cancelRequest,
    getRequest,
    acceptUser,
    rejectUser,
    getGroupData,
    revokeInvite,
    plantTree,
    setPrivacy,
    setName,
}