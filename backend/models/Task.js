const mongoose = require('mongoose')

const Schema = mongoose.Schema

const taskSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    deadline: {
        type: Date,
        required: false
    },
    sectionId: {
        type: String,
        required: true,
    },
    isCompleted: {
        type: Boolean,
        required: true,
    },
    user_id: {
        type: String,
        required: true
    },
    // isGroup: {
    //     type: Boolean,
    //     required: true,
    // }
}, { timestamps: true })

module.exports = mongoose.model('Task', taskSchema)