const Task = require('../models/Task.js')
const mongoose = require('mongoose')

// checks
const noTaskFound = "No such Task found"
const checkValidId = (id) => {
    return mongoose.Types.ObjectId.isValid(id)
}
const populateEmptyFields = (task, emptyFields) => {
    if (!task.title) {
        emptyFields.push('title')
    }
}

// get all tasks
const getAllTasks = async (req, res) => {
    const user_id = req.user._id

    const tasks = await Task.find({ user_id }).sort({createdAt: -1})

    res.status(200).json(tasks)
}

// get single task
const getTask = async (req, res) => {
    const { id } = req.params

    if (!checkValidId(id)) {
        return res.status(404).json({error: noTaskFound})
    }

    const task = await Task.findById(id)

    if (!task) {
        return res.status(404).json({error: noTaskFound})
    }

    res.status(200).json(task)
}

// create new task
const createTask = async (req, res) => {
    const {title, description, deadline, isCompleted, sectionId} = req.body

    let emptyFields = []

    populateEmptyFields(req.body, emptyFields)

    if (emptyFields.length > 0) {
        return res.status(400).json({error: 'Please fill in required fields', emptyFields})
    }

    try {
        const user_id = req.user._id
        const task = await Task.create({title, description, deadline, isCompleted, sectionId, user_id})
        res.status(200).json(task)
    } catch (error) {
        res.status(400).json({error: error.message, emptyFields: emptyFields})
    }
}

// delete a task
const deleteTask = async (req, res) => {
    const { id } = req.params

    if (!checkValidId(id)) {
        return res.status(404).json({error: noTaskFound})
    }

    const task = await Task.findOneAndDelete({_id: id})

    if (!task) {
        return res.status(404).json({error: noTaskFound})
    }

    res.status(200).json(task)
}

// update a task
const updateTask = async (req, res) => {
    const { id } = req.params

    if (!checkValidId(id)) {
        return res.status(404).json({error: noTaskFound})
    }

    let emptyFields = []

    populateEmptyFields(req.body, emptyFields)

    if (emptyFields.length > 0) {
        return res.status(400).json({error: 'Please fill in required fields', emptyFields})
    }

    const task = await Task.findOneAndUpdate({_id: id}, {
        ...req.body
    })

    if (!task) {
        return res.status(404).json({error: noTaskFound})
    }

    res.status(200).json(await Task.findById(id))
}

// export module
module.exports = {
    getAllTasks,
    getTask,
    createTask,
    deleteTask,
    updateTask,
}