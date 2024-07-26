const ChatChannel = require('../models/ChatChannel.js')
const ChatMessage = require('../models/ChatMessage.js')
const User = require('../models/User.js')
const Group = require('../models/Group.js')
const mongoose = require('mongoose')
const { io, getSocketId } = require('../socket/socket.js')

// get channel messages
const getChannelMessages = async (req, res) => {
    try {
        const { id: channelId } = req.params
        const senderId = req.user._id
        
        if (!mongoose.Types.ObjectId.isValid(channelId)) return res.status(200).json([])
        
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

    let channelInfo = []
    await Promise.all(await chatChannels.map(channel => {
        return new Promise(async (resolve, reject) => {
            if (channel.participants.includes(req.user._id)) {
                channelInfo.push(await channel.getChannelInfo(req.user._id))
            }
            resolve()
        })
    }))

    res.status(200).json(channelInfo)
}

// find channels by username
const findChannelsByUsername = async (req, res) => {
    const { user: username } = req.params
    const senderId = req.user._id

    const user = await User.findById(senderId)
    if (!user) return res.status(404).json({ error: "User not found" })
    const dmReceivers = await User.findUserByUsername(username.trim())
    const groupReceivers = await Group.findGroupByName(username.trim())

    let chatChannels = []
    for (i in dmReceivers) {
        const receiver = dmReceivers[i]
        if (receiver._id.equals(senderId)) continue

        let channel = await ChatChannel.findOne({
            participants: { $all: [senderId, receiver._id] },
            type: "direct"
        })
        if (!channel) {
            channel = ChatChannel.createDirectChannelInfo(user, receiver)
        } else {
            channel = await channel.getChannelInfo(senderId)
        }
        chatChannels.push(channel)
    }

    for (i in groupReceivers) {
        const receiver = groupReceivers[i]
        let channel = await ChatChannel.findById(receiver.chatChannelID)
        channel = await channel.getChannelInfo(senderId)
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
        
        let isNewChannel = false
        let chatChannel = await ChatChannel.findOne({
            participants: { $all: [senderId, receiver._id] },
            type: "direct"
        })

        if (!chatChannel) {
            chatChannel = await ChatChannel.create({
                participants: [senderId, receiver._id],
                type: "direct"
            })
            isNewChannel = true
        }

        const newMessage = new ChatMessage({
            senderId: senderId,
            channelId: chatChannel._id,
            message: message.trim()
        })

        if (newMessage) {
            chatChannel.messages.push(newMessage._id)
        }
        
        // save all in parallel
        await Promise.all([chatChannel.save(), newMessage.save()])

         // update recent chats
         await Promise.all(await chatChannel.participants.map(async p => {
            return new Promise(async (resolve, reject) => {
                const user = await User.findById(p._id)
                user.addRecentChatChannel(chatChannel)
                resolve()
            })
        }))
        
        // update in realtime using socket
        chatChannel.participants.forEach(async p => {
            if (!p.equals(senderId)) {
                const socketId = getSocketId(p._id)
                if (socketId) {
                    io.to(socketId).emit("newMessage", newMessage)
                }
            }
        })
        
        if (isNewChannel) {
            res.status(200).json({
                channel: await chatChannel.getChannelInfo(senderId),
                message: newMessage
            })
        } else {
            res.status(200).json({
                message: newMessage
            })
        }
        
    } catch (error) {
        console.log("Error in sendDirectMessage controller: ", error.message)
        res.status(500).json({ error: "Internal server error" })
    }
}

// send group message
const sendGroupMessage = async (req, res) => {
    try {
        const { id: channelID } = req.params
        const { message } = req.body
        const senderId = req.user._id

        const chatChannel = await ChatChannel.findById(channelID)
        
        if (!chatChannel || !chatChannel.participants.includes(senderId)) return res.status(404).json({ error: "Channel not found" })

        const newMessage = new ChatMessage({
            senderId: senderId,
            channelId: chatChannel._id,
            message: message.trim()
        })

        if (newMessage) {
            chatChannel.messages.push(newMessage._id)
        }
        
        // save all in parallel
        await Promise.all([chatChannel.save(), newMessage.save()])

        // update recent chats
        await Promise.all(await chatChannel.participants.map(async p => {
            return new Promise(async (resolve, reject) => {
                const user = await User.findById(p._id)
                user.addRecentChatChannel(chatChannel)
                resolve()
            })
        }))
        
        // update in realtime using socket
        chatChannel.participants.forEach(async p => {
            if (!p.equals(senderId)) {
                const socketId = getSocketId(p._id)
                if (socketId) {
                    io.to(socketId).emit("newMessage", newMessage)
                }
            }
        })
        
        res.status(200).json({
            message: newMessage
        })
    } catch (error) {
        console.log("Error in sendGroupMessage controller: ", error.message)
        res.status(500).json({ error: "Internal server error" })
    }
}

// export module
module.exports = {
    getChannelMessages,
    sendDirectMessage,
    sendGroupMessage,
    findChannelsByUsername,
    getRecentChannels,
}