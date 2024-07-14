const mongoose = require('mongoose')

const Schema = mongoose.Schema

const taskSectionSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    isGroup: {
        type: Boolean,
        required: true
    }
}, {})

module.exports = mongoose.model('TaskSection', taskSectionSchema)