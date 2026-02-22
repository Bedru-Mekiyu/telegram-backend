const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["text", "image", "video", "file", "voice"],
    default: "text"
  },
  text: {
    type: String,
    required: function() { return this.type === "text"; }
  },
  attachment: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  },
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  reactions: [{
    emoji: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model("Message", messageSchema)