const Message = require("../models/Message")
const Chat = require("../models/Chat")
const { NotFoundError, ForbiddenError } = require("../utils/customError")
const { getIo } = require("../sockets/socket")

// Send message
exports.sendMessage = async (req, res) => {
  const myId = req.user.id
  const { chatId, text, type = 'text' } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  // Security: only members can send
  if (!chat.members.includes(myId)) {
    throw new ForbiddenError("Not your chat")
  }

  let attachment = null;
  if (req.file) {
    attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };
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
  io.to(chatId).emit('newMessage', message)

  res.status(201).json(message)
}

// Get messages of a chat
exports.getMessages = async (req, res) => {
  const myId = req.user.id
  const { chatId } = req.params

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  if (!chat.members.includes(myId)) {
    throw new ForbiddenError("Not your chat")
  }

  const messages = await Message.find({ chatId })
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

  if (message.senderId.toString() !== myId) {
    throw new ForbiddenError("Can only delete your own messages")
  }

  await Message.findByIdAndDelete(messageId)

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

  const chat = await Chat.findById(originalMessage.chatId)
  if (!chat.members.includes(myId)) {
    throw new ForbiddenError("Not your chat")
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
  const { chatId, query } = req.query

  if (!query) {
    return res.json([])
  }

  const chat = await Chat.findById(chatId)
  if (!chat) throw new NotFoundError("Chat not found")

  if (!chat.members.includes(myId)) {
    throw new ForbiddenError("Not your chat")
  }

  const messages = await Message.find({
    chatId,
    text: { $regex: query, $options: 'i' }
  })
  .populate("senderId", "username email")
  .sort({ createdAt: -1 })
  .limit(50)

  res.json(messages)
}
