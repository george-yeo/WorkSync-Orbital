const mongoose = require('mongoose')

const Schema = mongoose.Schema

const chatMessageSchema = new Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatChannel",
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('ChatMessage', chatMessageSchema)