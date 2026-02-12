// models/User.js
const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  avatar: String,

  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },

  refreshTokens: [String]
}, { timestamps: true })

module.exports = mongoose.model("User", userSchema)
