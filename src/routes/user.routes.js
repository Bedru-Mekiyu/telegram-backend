const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")
const { searchUsers, updateProfile } = require("../controllers/user.controller")
const multer = require("multer")
const path = require("path")

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: "uploads/avatars/",
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9)
      cb(null, "avatar-" + unique + path.extname(file.originalname))
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    const mime = allowed.test(file.mimetype)
    if (ext && mime) cb(null, true)
    else cb(new Error("Invalid image file"))
  }
})

router.get("/", auth, searchUsers) // ?query=
router.put("/", auth, avatarUpload.single("avatar"), updateProfile)

module.exports = router