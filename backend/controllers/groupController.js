const Group = require('../models/Group')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

//create new group
const createGroup = async (req, res) => {
    const {name, createdBy} = req.body
    try {
        const group = await Group.createGroup(name, createdBy)
        res.status(200).json(name, createdBy)
    } catch(error) {
        res.status(400).json({error: error.message})
    }
}

//add user
const addUser = async (req, res) => {
    const { id } = req.params
    const { user } = req.body
    try {
        const group = Group.updateOne(
            { _id: id},
            { $push: {pending: user}}
        )
        res.status(200).json(await Group.find({_id: id }))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const acceptGroup = async (req, res) => {
    const { id } = req.params
    const { user } = req.body
    try {
        const group = Group.updateOne(
            { _id: id},
            { $pull: { pending: user}},
            { $push: { members: user }}
        )
        res.status(200).json(await Group.find({_id: id }))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

module.exports = {createGroup, addUser, acceptGroup}