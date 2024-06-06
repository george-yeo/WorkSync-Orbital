const mongoose = require('mongoose')
const ChatMessage = require('./ChatMessage')

const Schema = mongoose.Schema

const chatChannelSchema = new Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatMessage",
            default: [],
            required: true
        }
    ],
    type: {
        type: "String",
        enum: ["group", "direct"],
        required: true
    },
    pic: {
        type: "String",
        default: ''
    },
    name: {
        type: "String",
    }
}, { timestamps: true })

// get safe channel info method, removing messages
chatChannelSchema.methods.getChannelInfo = async function(receiver) {
    let info = (({ messages, ...object }) => object)((await ChatChannel.populate(this, {path: "participants"}))._doc)
    
    info.participants = info.participants.map(user => user.getSafeData())
    
    if (this.messages[0]) {
        info.lastMessage = (await ChatMessage.findById(this.messages[this.messages.length-1])).message
     } else {
        info.lastMessage = ''
     }

    // if direct message and receiver is provided
    if (info.type === "direct" && receiver) {
        info.pic = receiver.profilePic
        info.name = receiver.username
    }

    return info
}

// create safe direct channel info if channel does not exist, removing messages
chatChannelSchema.statics.createDirectChannelInfo = function(sender, receiver) {
    return {
        participants: [sender.getSafeData(), receiver.getSafeData()],
        type: "direct",
        pic: receiver.profilePic,
        name: receiver.username,
        isNew: true
    }
}

const ChatChannel = mongoose.model('ChatChannel', chatChannelSchema)
module.exports = ChatChannel