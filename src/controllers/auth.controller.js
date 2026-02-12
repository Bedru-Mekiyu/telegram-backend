const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { ValidationError, NotFoundError, UnauthorizedError } = require("../utils/customError")

// Register
exports.register = async (req, res) => {
  const { username, email, password } = req.body

  const exists = await User.findOne({ email })
  if (exists) {
    throw new ValidationError("Email already exists")
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await User.create({
    username,
    email,
    password: hashed
  })

  res.status(201).json({
    message: "User registered",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}

// Refresh Token
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new ValidationError("Refresh token required")
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    const user = await User.findById(decoded.id)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    // Check if refresh token is in user's tokens
    const isValid = await Promise.all(user.refreshTokens.map(token => bcrypt.compare(refreshToken, token)))
    if (!isValid.some(valid => valid)) {
      throw new UnauthorizedError("Invalid refresh token")
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    )

    res.json({
      accessToken: newAccessToken
    })
  } catch (err) {
    throw new UnauthorizedError("Invalid refresh token")
  }
}

// Logout
exports.logout = async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new ValidationError("Refresh token required")
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    const user = await User.findById(decoded.id)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    // Remove the refresh token
    const tokensToKeep = []
    for (const token of user.refreshTokens) {
      const match = await bcrypt.compare(refreshToken, token)
      if (!match) {
        tokensToKeep.push(token)
      }
    }
    user.refreshTokens = tokensToKeep
    await user.save()

    res.json({
      message: "Logged out successfully"
    })
  } catch (err) {
    throw new UnauthorizedError("Invalid refresh token")
  }
}

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user) {
    throw new NotFoundError("User not found")
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw new UnauthorizedError("Invalid password")
  }

  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  )

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  )

  // Hash the refresh token before storing
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

  // Add to user's refresh tokens
  user.refreshTokens.push(hashedRefreshToken)
  await user.save()

  res.json({
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}
