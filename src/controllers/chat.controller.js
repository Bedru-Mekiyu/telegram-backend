const Chat = require("../models/Chat")
const { ValidationError, NotFoundError, ForbiddenError } = require("../utils/customError")
const { getIo } = require("../sockets/socket")

// Create private chat
exports.createPrivateChat = async (req, res) => {
  const myId = req.user.id
  const { userId } = req.body

  if (myId === userId) {
    throw new ValidationError("Cannot chat with yourself")
  }

  // Check if chat already exists
  const existing = await Chat.findOne({
    type: "private",
    members: { $all: [myId, userId] }
  })

  if (existing) {
    return res.json(existing)
  }

  const chat = await Chat.create({
    members: [myId, userId]
  })

  res.status(201).json(chat)
}

// Create channel
exports.createChannel = async (req, res) => {
  const myId = req.user.id
  const { name, description } = req.body

  const chat = await Chat.create({
    type: "channel",
    name,
    description,
    admin: myId,
    members: [myId],
    subscribers: [myId]
  })

  res.status(201).json(chat)
}

// Subscribe to channel
exports.subscribe = async (req, res) => {
  const myId = req.user.id
  const { chatId } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Channel not found")
  if (chat.type !== "channel") throw new ValidationError("Not a channel")

  if (!chat.subscribers.includes(myId)) {
    chat.subscribers.push(myId)
    await chat.save()
  }

  res.json(chat)
}

// List my chats
exports.getMyChats = async (req, res) => {
  const myId = req.user.id

  const chats = await Chat.find({
    $or: [
      { members: myId },
      { subscribers: myId }
    ]
  }).populate("members", "username email").populate("subscribers", "username email")

  res.json(chats)
}

// Create group
exports.createGroupChat = async (req, res) => {
  const myId = req.user.id
  const { name, members } = req.body

  const chat = await Chat.create({
    type: "group",
    name,
    admin: myId,
    members: [myId, ...members]
  })

  res.status(201).json(chat)
}

// Add member
exports.addMember = async (req, res) => {
  const myId = req.user.id
  const { chatId, userId } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  if (chat.admin.toString() !== myId)
    throw new ForbiddenError("Only admin can add")

  if (!chat.members.includes(userId)) {
    chat.members.push(userId)
    await chat.save()
  }

  res.json(chat)
}

// Remove member
exports.removeMember = async (req, res) => {
  const myId = req.user.id
  const { chatId, userId } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  if (chat.admin.toString() !== myId)
    throw new ForbiddenError("Only admin can remove")

  chat.members = chat.members.filter(id => id.toString() !== userId)
  await chat.save()

  res.json(chat)
}

// Rename group
exports.renameGroup = async (req, res) => {
  const myId = req.user.id
  const { chatId, name } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  if (chat.admin.toString() !== myId)
    throw new ForbiddenError("Only admin can rename")

  chat.name = name
  await chat.save()

  res.json(chat)
}

// Pin message
exports.pinMessage = async (req, res) => {
  const myId = req.user.id
  const { chatId, messageId } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  if (chat.admin?.toString() !== myId)
    throw new ForbiddenError("Only admin can pin")

  if (!chat.pinnedMessages.includes(messageId)) {
    chat.pinnedMessages.push(messageId)
    await chat.save()
  }

  const io = getIo()
  io.to(chatId.toString()).emit("messagePinned", messageId)

  res.json(chat)
}

// Unpin message
exports.unpinMessage = async (req, res) => {
  const myId = req.user.id
  const { chatId, messageId } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  if (chat.admin?.toString() !== myId)
    throw new ForbiddenError("Only admin can unpin")

  chat.pinnedMessages = chat.pinnedMessages.filter(id => id.toString() !== messageId)
  await chat.save()

  const io = getIo()
  io.to(chatId.toString()).emit("messageUnpinned", messageId)

  res.json(chat)
}