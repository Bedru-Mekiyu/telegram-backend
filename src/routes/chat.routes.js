const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")
const { createPrivateChat, getMyChats, createGroupChat, addMember, removeMember, renameGroup } = require("../controllers/chat.controller")

router.post("/private", auth, createPrivateChat)
router.get("/", auth, getMyChats)
router.post("/group", auth, createGroupChat)
router.put("/group/add", auth, addMember)
router.put("/group/remove", auth, removeMember)
router.put("/group/rename", auth, renameGroup)


module.exports = router
