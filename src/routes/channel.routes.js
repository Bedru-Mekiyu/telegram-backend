// routes/channel.routes.js
const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")
const { createChannel, subscribe, postToChannel } = require("../controllers/channel.controller")

router.post("/", auth, createChannel)
router.post("/subscribe", auth, subscribe)
router.post("/post", auth, postToChannel)

module.exports = router
