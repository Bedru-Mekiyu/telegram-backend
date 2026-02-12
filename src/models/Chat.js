const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["private", "group"],
    default: "private"
  },
  name: {
    type: String
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, { timestamps: true })

module.exports = mongoose.model("Chat", chatSchema)
