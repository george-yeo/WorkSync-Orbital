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
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const tasks = await Task.find({ user_id }).sort({ [sortBy]: sortOrder });

    res.status(200).json(tasks)
}

// get single task
const getTask = async (req, res) => {
    const { id } = req.params

    if (!checkValidId(id)) {
        return res.status(404).json({error: noTaskFound})
    }

    const task = await Task.find({
        _id: id
    })

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

    const task = await Task.findOneAndDelete({
        _id: id
    })

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

    const task = await Task.findOneAndUpdate({
        _id: id
    }, {
        ...req.body
    })

    if (!task) {
        return res.status(404).json({error: noTaskFound})
    }

    try {
        const section = await Task.model("TaskSection").findById(task.sectionId)
        if (section.isGroup) {
            const group = await Task.model("Group").findById(section.group_id)
            if (req.body.isCompleted !== null && req.body.isCompleted !== task.isCompleted) {
                if (req.body.isCompleted) {
                    await group.addGrowthProgress()
                } else {
                    await group.subGrowthProgress()
                }
            }
            return res.status(200).json({task: await Task.findById(task._id), group: await group.getSafeData()})
        } else {
            return res.status(200).json({task: await Task.findById(task._id)})
        }
    } catch (error) {
        return res.status(400).json({error: error.message})
    }
}

// create new task
const createGroupTask = async (req, res) => {
    const user_id = req.user._id
    const {title, description, deadline, isCompleted, group_id} = req.body

    const group = await Task.model("Group").findById(group_id)
    if (!group) {
        return res.status(404).json({error: "Ground not found"})
    }

    if (!await group.canManage(user_id)) {
        return res.status(400).json({error: "User has no privileges."})
    }

    let emptyFields = []

    populateEmptyFields(req.body, emptyFields)

    if (emptyFields.length > 0) {
        return res.status(400).json({error: 'Please fill in required fields', emptyFields})
    }

    try {
        let task
        await Promise.all(await group.membersID.map(member_id => {
            return new Promise(async (resolve, reject) => {
                const section = await Task.model("TaskSection").findOne({
                    group_id: group_id,
                    user_id: member_id,
                    isGroup: true
                })
                const memberTask = await Task.create({title, description, deadline, isCompleted, sectionId: section._id, user_id: member_id})
                if (member_id.equals(user_id)) {
                    task = memberTask
                }
                resolve()
            })
        }))
        
        // for owner
        const section = await Task.model("TaskSection").findOne({
            group_id: group_id,
            user_id: group.createdByID,
            isGroup: true
        })
        const memberTask = await Task.create({title, description, deadline, isCompleted, sectionId: section._id, user_id: group.createdByID})
        if (group.createdByID.equals(user_id)) {
            task = memberTask
        }
        
        res.status(200).json(task)
    } catch (error) {
        res.status(400).json({error: error.message, emptyFields: emptyFields})
    }
}

// const getGroupTasks = async (req, res) => {
//     try {
//         const { sectionId } = req.params;
//         const sortBy = req.query.sortBy || 'createdAt';
//         const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

//         const tasks = await Task.find({ sectionId, isGroup: true }).sort({ [sortBy]: sortOrder });

//         res.status(200).json(tasks);
//     } catch (error) {
//         console.error(error);
//     }
// }


// export module
module.exports = {
    getAllTasks,
    getTask,
    createTask,
    deleteTask,
    updateTask,
    //getGroupTasks,
    createGroupTask
}