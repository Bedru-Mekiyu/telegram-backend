// Verify SMTP connection using Nodemailer
require("dotenv").config()

const transport = require("../src/services/email")

;(async () => {
  try {
    await transport.verifyTransport()
    console.log("SMTP connection OK")
    process.exit(0)
  } catch (err) {
    console.error("SMTP verify failed:", err.message)
    process.exit(1)
  }
})()
