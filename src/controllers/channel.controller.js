// controllers/channel.controller.js
const Channel = require("../models/Channel")
const Message = require("../models/Message")
const { ForbiddenError } = require("../utils/customError")

exports.createChannel = async (req, res) => {
  const myId = req.user.id
  const { name, description } = req.body

  const channel = await Channel.create({
    name,
    description,
    admin: myId,
    subscribers: [myId]
  })

  res.status(201).json(channel)
}

exports.subscribe = async (req, res) => {
  const myId = req.user.id
  const { channelId } = req.body

  const channel = await Channel.findById(channelId)
  if (!channel.subscribers.includes(myId)) {
    channel.subscribers.push(myId)
    await channel.save()
  }

  res.json(channel)
}

exports.postToChannel = async (req, res) => {
  const myId = req.user.id
  const { channelId, text } = req.body

  const channel = await Channel.findById(channelId)
  if (channel.admin.toString() !== myId) {
    throw new ForbiddenError("Only admin can post")
  }

  const message = await Message.create({
    channelId,
    senderId: myId,
    text,
    seenBy: []
  })

  res.status(201).json(message)
}
