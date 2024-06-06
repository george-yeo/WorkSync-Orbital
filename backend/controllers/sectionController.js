const Section = require('../models/Section.js')
const mongoose = require('mongoose')

// checks
const noSectionFound = "No such Section found"
const checkValidId = (id) => {
    return mongoose.Types.ObjectId.isValid(id)
}

// get all sections
const getAllSections = async (req, res) => {
    const user_id = req.user._id

    const sections = await Section.find({ user_id }).sort({createdAt: -1})

    res.status(200).json(sections)
}

// get single section
const getSection = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id


    if (!checkValidId(id)) {
        return res.status(404).json({error: noSectionFound})
    }

    const section = await Section.find({
        user_id: user_id,
        _id: id
    })

    if (!section) {
        return res.status(404).json({error: noSectionFound})
    }

    res.status(200).json(section)
}

// create new section
const createSection = async (req, res) => {
    const {title, description, deadline, isCompleted} = req.body

    let emptyFields = []

    if (!title) {
        emptyFields.push('title')
    }

    if (emptyFields.length > 0) {
        return res.status(400).json({error: 'Please fill in required fields', emptyFields})
    }

    try {
        const user_id = req.user._id
        const section = await Section.create({title, description, deadline, isCompleted, user_id})
        res.status(200).json(section)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// delete a section
const deleteSection = async (req, res) => {
    const { id } = req.params
    const user_id = req.user._id

    if (!checkValidId(id)) {
        return res.status(404).json({error: noSectionFound})
    }

    const section = await Section.findOneAndDelete({
        user_id: user_id,
        _id: id
    })

    if (!section) {
        return res.status(404).json({error: noSectionFound})
    }

    res.status(200).json(section)
}

// update a section
const updateSection = async (req, res) => {
    const { id } = req.params

    if (!checkValidId(id)) {
        return res.status(404).json({error: noSectionFound})
    }

    const section = await Section.findOneAndUpdate({_id: id}, {
        ...req.body
    })

    if (!section) {
        return res.status(404).json({error: noSectionFound})
    }

    res.status(200).json(section)
}

// export module
module.exports = {
    getAllSections,
    getSection,
    createSection,
    deleteSection,
    updateSection,
}