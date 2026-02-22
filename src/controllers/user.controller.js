const User = require("../models/User")
const { ValidationError } = require("../utils/customError")

exports.searchUsers = async (req, res) => {
  const { query } = req.query

  if (!query) throw new ValidationError("Query required")

  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  }).select("username email avatar")

  res.json(users)
}

exports.updateProfile = async (req, res) => {
  const myId = req.user.id
  const { username, email } = req.body
  const update = {}

  if (username) update.username = username
  if (email) update.email = email
  if (req.file) update.avatar = `/uploads/avatars/${req.file.filename}`

  const user = await User.findByIdAndUpdate(myId, update, { new: true }).select("-password -refreshTokens")

  res.json(user)
}