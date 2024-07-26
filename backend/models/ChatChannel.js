const mongoose = require('mongoose')
const ChatMessage = require('./ChatMessage')
const Group = require('./Group')

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
    // pic: {
    //     type: "String",
    //     default: ''
    // },
    // name: {
    //     type: "String",
    // },
    // groupID: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Group",
    // }
}, { timestamps: true })

// check if id is a participant
chatChannelSchema.methods.isParticipant = function(userId) {
    return this.participants.includes(userId)
}

// get safe channel info method, removing information when necessary
chatChannelSchema.methods.getChannelInfo = async function(senderId) {
    const isParticipant = this.isParticipant(senderId)
    let info = (({ messages, ...object }) => object)((await ChatChannel.populate(this, {path: "participants"}))._doc)
    
    if (info.type === "direct" || (info.type == "group" && isParticipant)) {
        info.participants = info.participants.map(user => user.getSafeData())
    } else {
        info.participants = null
    }
    
    if (isParticipant && this.messages[0]) {
        info.lastMessage = (await ChatMessage.findById(this.messages[this.messages.length-1])).message
     } else {
        info.lastMessage = ''
     }

    // if direct message and sender is provided
    if (info.type === "direct" && senderId) {
        const receiver = this.participants.find(p => !p.equals(senderId))
        info.pic = receiver.profilePic
        info.name = receiver.username
    } else if (info.type == "group") {
        const group = await Group.findOne({ chatChannelID: this._id })
        info.pic = group.groupPic
        info.name = group.name
        info.groupID = group._id

        if (!isParticipant) {
            info.accessLocked = true
            info.isPrivate = group.isPrivate
            if (group.isRequesting(senderId)) {
                info.isRequesting = true
            }
        }
    }

    return info
}

// get other user for dm
chatChannelSchema.methods.getOtherUser = async function(userId) {
    if (this.type != "direct") return null
    
    return this.participants.find(p => !p.equals(userId))
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

chatChannelSchema.methods.addParticipant = function(user) {
    if (this.type == "direct") throw Error("Cannot add participant to dm")

    if (this.participants.includes(user._id)) return
    
    this.participants.push(user._id)
    user.addRecentChatChannel(this)
    this.save()
}

chatChannelSchema.methods.removeParticipant = function(userId) {
    if (this.type == "direct") throw Error("Cannot remove participant from dm")
    
    this.participants = this.participants.filter((user_id) => !user_id.equals(userId))
    this.save()
}

const ChatChannel = mongoose.model('ChatChannel', chatChannelSchema)
module.exports = ChatChannel