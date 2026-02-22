require("dotenv").config()
const express = require("express")
const cors = require("cors")
const http = require("http")
const path = require("path")
const multer = require("multer")
const fs = require("fs")

const connectDB = require("./config/db")
const auth = require("./middlewares/auth.middleware")

const authRoutes = require("./routes/auth.routes")
const chatRoutes = require("./routes/chat.routes")
const messageRoutes = require("./routes/message.routes")
const userRoutes = require("./routes/user.routes")

const { initSocket, getIo } = require("./sockets/socket")
const { NotFoundError, ForbiddenError } = require("./utils/customError")

const app = express()
const server = http.createServer(app)

// Create upload directories if they don't exist
if (!fs.existsSync(path.join(__dirname, "uploads"))) {
  fs.mkdirSync(path.join(__dirname, "uploads"))
}
if (!fs.existsSync(path.join(__dirname, "uploads/avatars"))) {
  fs.mkdirSync(path.join(__dirname, "uploads/avatars"))
}

/* ---------------- CORE MIDDLEWARE ---------------- */

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/uploads/avatars", express.static(path.join(__dirname, "uploads/avatars")))

/* ---------------- DATABASE ---------------- */

connectDB()

/* ---------------- ROUTES ---------------- */

app.use("/api/auth", authRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/users", userRoutes)


app.get("/api/protected", auth, (req, res) => {
  res.json({ message: "You are authorized", user: req.user })
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

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

/* ---------------- GRACEFUL SHUTDOWN ---------------- */

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...")
  process.exit(0)
})