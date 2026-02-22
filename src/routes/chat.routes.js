const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")
const { createPrivateChat, getMyChats, createGroupChat, addMember, removeMember, renameGroup, createChannel, subscribe, pinMessage, unpinMessage } = require("../controllers/chat.controller")

router.post("/private", auth, createPrivateChat)
router.post("/channel", auth, createChannel)
router.post("/channel/subscribe", auth, subscribe)
router.get("/", auth, getMyChats)
router.post("/group", auth, createGroupChat)
router.put("/group/add", auth, addMember)
router.put("/group/remove", auth, removeMember)
router.put("/group/rename", auth, renameGroup)
router.post("/pin", auth, pinMessage)
router.post("/unpin", auth, unpinMessage)

module.exports = router