const { Server }  = require("socket.io")
const http = require("http")
const express = require("express")

const app = express()

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin:["http://localhost:3000"],
    methods:["GET", "POST"]
  }  
})

const userSocketMap = {}; // {userId: socketId}

const getSocketId = (userId) => {
    return userSocketMap[userId]
}

io.on("connection", (socket) => {
    console.log("a user has connected", socket.id)

    const userId = socket.handshake.query.userId
    if (userId !== undefined) userSocketMap[userId] = socket.id

    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    socket.on("disconnect", () => {
        if (userSocketMap[userId] === socket.id) {
            console.log("user disconnected", socket.id)
            delete userSocketMap[userId]
            io.emit("getOnlineUsers", Object.keys(userSocketMap))
        }
    })
})

io.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
})

module.exports = { app, io, server, getSocketId }