const { Server } = require("socket.io")
const User = require("../models/User")
const Message = require("../models/Message")

let io

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  })

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id)

    socket.on("online", async (userId) => {
      socket.userId = userId
      await User.findByIdAndUpdate(userId, { lastSeen: null, isOnline: true })
    })

    socket.on("joinChats", (chatIds) => {
      chatIds.forEach(id => socket.join(id.toString()))
    })

    socket.on("typing", (chatId) => {
      socket.to(chatId.toString()).emit("typing", socket.userId)
    })

    socket.on("stopTyping", (chatId) => {
      socket.to(chatId.toString()).emit("stopTyping", socket.userId)
    })

    socket.on("seen", async (chatId) => {
      await Message.updateMany(
        { chatId, seenBy: { $ne: socket.userId } },
        { $push: { seenBy: socket.userId } }
      )
      socket.to(chatId.toString()).emit("messagesSeen", socket.userId)
    })

    socket.on("disconnect", async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          lastSeen: new Date(),
          isOnline: false
        })
      }
      console.log("🔴 Disconnected:", socket.id)
    })
  })
}

exports.getIo = () => io