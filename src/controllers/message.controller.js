const Message = require("../models/Message")
const Chat = require("../models/Chat")
const { NotFoundError, ForbiddenError, ValidationError } = require("../utils/customError")
const { getIo } = require("../sockets/socket")

// Send message
exports.sendMessage = async (req, res) => {
  const myId = req.user.id
  const { chatId, text, type = 'text' } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  // Security: check permission to send
  if (chat.type === "channel") {
    if (chat.admin.toString() !== myId) {
      throw new ForbiddenError("Only admin can post in channel")
    }
  } else {
    if (!chat.members.includes(myId)) {
      throw new ForbiddenError("Not your chat")
    }
  }

  let attachment = null
  if (req.file) {
    attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    }
  }

  const message = await Message.create({
    chatId,
    senderId: myId,
    type,
    text: type === 'text' ? text : null,
    attachment,
    seenBy: [myId]
  })

  // Populate sender info for real-time emission
  await message.populate("senderId", "username email")

  // Emit the message to all members in the chat room
  const io = getIo()
  io.to(chatId.toString()).emit('newMessage', message)

  res.status(201).json(message)
}

// Get messages of a chat
exports.getMessages = async (req, res) => {
  const myId = req.user.id
  const { chatId } = req.params

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  // Security: check permission to view
  if (chat.type === "channel") {
    if (!chat.subscribers.includes(myId) && chat.admin?.toString() !== myId) {
      throw new ForbiddenError("Not subscribed to channel")
    }
  } else {
    if (!chat.members.includes(myId)) {
      throw new ForbiddenError("Not your chat")
    }
  }

  const messages = await Message.find({ chatId, deleted: false })
    .populate("senderId", "username email")
    .sort({ createdAt: 1 })

  res.json(messages)
}

// Mark messages as seen
exports.markSeen = async (req, res) => {
  const myId = req.user.id
  const { chatId } = req.params

  await Message.updateMany(
    { chatId, seenBy: { $ne: myId } },
    { $push: { seenBy: myId } }
  )

  res.json({ message: "Messages marked as seen" })
}

// Edit message
exports.editMessage = async (req, res) => {
  const myId = req.user.id
  const { messageId } = req.params
  const { text } = req.body

  const message = await Message.findById(messageId)
  if (!message) throw new NotFoundError("Message not found")
  if (message.deleted) throw new NotFoundError("Message deleted")

  if (message.senderId.toString() !== myId) {
    throw new ForbiddenError("Can only edit your own messages")
  }

  message.text = text
  message.edited = true
  message.editedAt = new Date()
  await message.save()

  await message.populate("senderId", "username email")

  const io = getIo()
  io.to(message.chatId.toString()).emit('messageEdited', message)

  res.json(message)
}

// Delete message
exports.deleteMessage = async (req, res) => {
  const myId = req.user.id
  const { messageId } = req.params

  const message = await Message.findById(messageId)
  if (!message) throw new NotFoundError("Message not found")

  const chat = await Chat.findById(message.chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  const isAdmin = chat.admin && chat.admin.toString() === myId
  const isOwn = message.senderId.toString() === myId

  if (!isOwn && !isAdmin) {
    throw new ForbiddenError("Can only delete your own messages or as admin")
  }

  // Optional time limit for non-admins
  if (!isAdmin) {
    const timeDiff = (new Date() - message.createdAt) / (1000 * 60 * 60)
    if (timeDiff > 48) {
      throw new ForbiddenError("Delete time limit exceeded (48 hours)")
    }
  }

  message.deleted = true
  await message.save()

  const io = getIo()
  io.to(message.chatId.toString()).emit('messageDeleted', messageId)

  res.json({ message: "Message deleted" })
}

// Add reaction
exports.addReaction = async (req, res) => {
  const myId = req.user.id
  const { messageId } = req.params
  const { emoji } = req.body

  const message = await Message.findById(messageId)
  if (!message) throw new NotFoundError("Message not found")
  if (message.deleted) throw new NotFoundError("Message deleted")

  // Check if user already reacted with this emoji
  const existingReaction = message.reactions.find(r =>
    r.userId.toString() === myId && r.emoji === emoji
  )

  if (existingReaction) {
    // Remove reaction if already exists
    message.reactions = message.reactions.filter(r =>
      !(r.userId.toString() === myId && r.emoji === emoji)
    )
  } else {
    // Add new reaction
    message.reactions.push({ emoji, userId: myId })
  }

  await message.save()
  await message.populate("senderId", "username email")
  await message.populate("reactions.userId", "username")

  const io = getIo()
  io.to(message.chatId.toString()).emit('reactionUpdated', message)

  res.json(message)
}

// Reply to message
exports.replyToMessage = async (req, res) => {
  const myId = req.user.id
  const { messageId } = req.params
  const { text, type = 'text' } = req.body

  const originalMessage = await Message.findById(messageId)
  if (!originalMessage) throw new NotFoundError("Message not found")
  if (originalMessage.deleted) throw new NotFoundError("Message deleted")

  const chat = await Chat.findById(originalMessage.chatId)
  if (chat.type === "channel") {
    if (chat.admin.toString() !== myId) {
      throw new ForbiddenError("Only admin can post in channel")
    }
  } else {
    if (!chat.members.includes(myId)) {
      throw new ForbiddenError("Not your chat")
    }
  }

  const message = await Message.create({
    chatId: originalMessage.chatId,
    senderId: myId,
    type,
    text: type === 'text' ? text : null,
    replyTo: messageId,
    seenBy: [myId]
  })

  await message.populate("senderId", "username email")
  await message.populate({
    path: 'replyTo',
    populate: { path: 'senderId', select: 'username' }
  })

  const io = getIo()
  io.to(originalMessage.chatId.toString()).emit('newMessage', message)

  res.status(201).json(message)
}

// Search messages
exports.searchMessages = async (req, res) => {
  const myId = req.user.id
  const { chatId } = req.params
  const { query } = req.query

  if (!query) {
    return res.json([])
  }

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  if (chat.type === "channel") {
    if (!chat.subscribers.includes(myId) && chat.admin?.toString() !== myId) {
      throw new ForbiddenError("Not subscribed to channel")
    }
  } else {
    if (!chat.members.includes(myId)) {
      throw new ForbiddenError("Not your chat")
    }
  }

  const messages = await Message.find({
    chatId,
    text: { $regex: query, $options: 'i' },
    deleted: false
  })
  .populate("senderId", "username email")
  .sort({ createdAt: -1 })
  .limit(50)

  res.json(messages)
}

// Forward message
exports.forwardMessage = async (req, res) => {
  const myId = req.user.id
  const { messageId } = req.params
  const { targetChatId } = req.body

  const original = await Message.findById(messageId)
  if (!original) throw new NotFoundError("Message not found")
  if (original.deleted) throw new NotFoundError("Message deleted")

  // Check access to original chat
  const originalChat = await Chat.findById(original.chatId)
  if (!originalChat) throw new NotFoundError("Original chat not found")

  let hasAccess = false
  if (originalChat.type === "channel") {
    hasAccess = originalChat.subscribers.includes(myId) || originalChat.admin?.toString() === myId
  } else {
    hasAccess = originalChat.members.includes(myId)
  }
  if (!hasAccess) throw new ForbiddenError("No access to original message")

  // Check send permission in target
  const targetChat = await Chat.findById(targetChatId)
  if (!targetChat) throw new NotFoundError("Target chat not found")

  let canSend = false
  if (targetChat.type === "channel") {
    canSend = targetChat.admin.toString() === myId
  } else {
    canSend = targetChat.members.includes(myId)
  }
  if (!canSend) throw new ForbiddenError("Cannot send to target chat")

  const forwarded = await Message.create({
    chatId: targetChatId,
    senderId: myId,
    type: original.type,
    text: original.text,
    attachment: original.attachment,
    forwardedFrom: messageId,
    seenBy: [myId]
  })

  await forwarded.populate("senderId", "username email")

  const io = getIo()
  io.to(targetChatId.toString()).emit('newMessage', forwarded)

  res.status(201).json(forwarded)
}