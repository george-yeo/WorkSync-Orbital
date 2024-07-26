const mongoose = require('mongoose')

const Schema = mongoose.Schema

const groupCommentSchema = new Schema ({
    message: {
        type: String,
        required: true,
    },
    sender_id: {
        type: Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    group_id: {
        type: Schema.Types.ObjectId,
        ref:'Group',
        required: true
    },
}, { timestamps: true })

module.exports = mongoose.model('GroupComment', groupCommentSchema)