const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization")

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" })
  }

  const token = authHeader.split(" ")[1] || authHeader

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Access token expired" })
    }
    res.status(401).json({ message: "Invalid access token" })
  }
}
