const ChatChannel = require('../models/ChatChannel.js')
const ChatMessage = require('../models/ChatMessage.js')
const User = require('../models/User.js')
const mongoose = require('mongoose')

// get channel messages
const getChannelMessages = async (req, res) => {
    try {
        const { id: channelId } = req.params
        const senderId = req.user._id
        
        const chatChannel = await ChatChannel.findOne({
            _id: channelId,
            participants: { $all: [ senderId ] }
        })

        if (!chatChannel) return res.status(404).json({error: "Chat channel not found"})

        res.status(200).json((await chatChannel.populate("messages")).messages)
    } catch (error) {
        console.log("Error in getChannelMessages controller: ", error.message)
        res.status(500).json({ error: "Internal server error" })
    }
}

// get recent channels
const getRecentChannels = async (req, res) => {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: "User not found" })

    const chatChannels = (await User.populate(user, {path: "recentChatChannels"})).recentChatChannels
    
    if (!chatChannels) return res.status(404).json({error: "Chat channels not found"})

    res.status(200).json(chatChannels)
}

// find channels by username
const findChannelsByUsername = async (req, res) => {
    const { user: username } = req.params
    const senderId = req.user._id

    const user = await User.findById(senderId)
    if (!user) return res.status(404).json({ error: "User not found" })
    const receivers = await User.findUserByUsername(username)

    let chatChannels = []
    for (i in receivers) {
        const receiver = receivers[i]
        if (receiver._id.equals(senderId)) continue

        let channel = await ChatChannel.findOne({
            participants: { $all: [senderId, receiver._id] },
            type: "direct"
        })
        if (!channel) {
            channel = ChatChannel.createDirectChannelInfo(user, receiver)
        } else {
            channel = await channel.getChannelInfo(receiver)
        }
        chatChannels.push(channel)
    }
    
    res.status(201).json(chatChannels)
}

// send direct message
const sendDirectMessage = async (req, res) => {
    try {
        const { id: receiverId } = req.params
        const { message } = req.body
        const senderId = req.user._id

        const receiver = await User.findById(receiverId)

        if (!receiver) return res.status(404).json({ error: "User not found" })

        let chatChannel = await ChatChannel.findOne({
            participants: { $all: [senderId, receiver._id] },
            type: "direct"
        })

        if (!chatChannel) {
            chatChannel = await ChatChannel.create({
                participants: [senderId, receiver._id],
                type: "direct"
            })
        }

        const newMessage = new ChatMessage({
            senderId: senderId,
            channelId: chatChannel._id,
            message: message
        })

        if (newMessage) {
            chatChannel.messages.push(newMessage._id)
        }

        await chatChannel.save()
        await newMessage.save()
        
        res.status(201).json(newMessage)
    } catch (error) {
        console.log("Error in sendDirectMessage controller: ", error.message)
        res.status(500).json({ error: "Internal server error" })
    }
}

// export module
module.exports = {
    getChannelMessages,
    sendDirectMessage,
    findChannelsByUsername,
    getRecentChannels,
}