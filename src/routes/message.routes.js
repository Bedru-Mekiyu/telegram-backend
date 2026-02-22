const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")
const { sendMessage, getMessages, markSeen, editMessage, deleteMessage, addReaction, replyToMessage, searchMessages, forwardMessage } = require("../controllers/message.controller")
const multer = require("multer")
const path = require("path")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, audio, and documents
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|mp3|wav|ogg|m4a|aac|pdf|doc|docx|txt/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

router.post("/", auth, upload.single('attachment'), sendMessage)

router.get("/:chatId", auth, getMessages)
router.put("/seen/:chatId", auth, markSeen)
router.put("/:messageId", auth, editMessage)
router.delete("/:messageId", auth, deleteMessage)
router.post("/:messageId/reaction", auth, addReaction)
router.post("/:messageId/reply", auth, replyToMessage)
router.post("/:messageId/forward", auth, forwardMessage)
router.get("/search/:chatId", auth, searchMessages)

module.exports = router