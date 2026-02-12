const { Server } = require("socket.io")

let io

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id)

    socket.on("joinChat", (chatId) => {
      socket.join(chatId)
    })

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id)
    })
  })
}

exports.getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!")
  }
  return io
}
