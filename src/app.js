require("dotenv").config()
const express = require("express")
const cors = require("cors")
const http = require("http")
const path = require("path")
const multer = require("multer")

const connectDB = require("./config/db")
const auth = require("./middlewares/auth.middleware")

const authRoutes = require("./routes/auth.routes")
const chatRoutes = require("./routes/chat.routes")
const messageRoutes = require("./routes/message.routes")

const { initSocket, getIo } = require("./sockets/socket")
const Chat = require("./models/Chat")
const Message = require("./models/Message")
const { NotFoundError, ForbiddenError } = require("./utils/customError")

const app = express()
const server = http.createServer(app)

/* ---------------- CORE MIDDLEWARE ---------------- */

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

/* ---------------- DATABASE ---------------- */

connectDB()

/* ---------------- ROUTES ---------------- */

app.use("/api/auth", authRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/messages", messageRoutes)

app.get("/api/protected", auth, (req, res) => {
  res.json({ message: "You are authorized", user: req.user })
})

/* ---------------- VOICE MESSAGE UPLOAD ---------------- */

const voiceUpload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9)
      cb(null, "voice-" + unique + path.extname(file.originalname))
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /mp3|wav|ogg|m4a|aac/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    const mime = allowed.test(file.mimetype)
    if (ext && mime) cb(null, true)
    else cb(new Error("Invalid audio file"))
  }
})

app.post("/api/messages/voice", auth, voiceUpload.single("audio"), async (req, res, next) => {
  try {
    const myId = req.user.id
    const { chatId } = req.body

    const chat = await Chat.findById(chatId)
    if (!chat) throw new NotFoundError("Chat not found")
    if (!chat.members.includes(myId)) throw new ForbiddenError("Not your chat")

    const message = await Message.create({
      chatId,
      senderId: myId,
      type: "voice",
      attachment: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      },
      seenBy: [myId]
    })

    await message.populate("senderId", "username email")

    const io = getIo()
    io.to(chatId).emit("newMessage", message)

    res.status(201).json(message)
  } catch (err) {
    next(err)
  }
})

/* ---------------- ERROR HANDLER ---------------- */

app.use((err, req, res, next) => {
  console.error(err.stack)

  const status = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  })
})

/* ---------------- SOCKET INIT ---------------- */

initSocket(server)

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5001

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

/* ---------------- GRACEFUL SHUTDOWN ---------------- */

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...")
  process.exit(0)
})
