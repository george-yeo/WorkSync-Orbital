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
        default: false
    },
    group_id: {
        type: Schema.Types.ObjectId,
    }
}, {})

module.exports = mongoose.model('TaskSection', taskSectionSchema)