const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["private", "group", "channel"],
    default: "private"
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }]
}, { timestamps: true })

module.exports = mongoose.model("Chat", chatSchema)