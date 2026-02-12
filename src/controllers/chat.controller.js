const Chat = require("../models/Chat")
const { ValidationError, NotFoundError, ForbiddenError } = require("../utils/customError")

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

// List my chats
exports.getMyChats = async (req, res) => {
  const myId = req.user.id

  const chats = await Chat.find({
    members: myId
  }).populate("members", "username email")

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
