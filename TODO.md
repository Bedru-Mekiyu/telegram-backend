# TODO: Add Access and Refresh Tokens

- [x] Update User.js model to include refreshTokens field (array of hashed tokens)
- [x] Modify auth.controller.js login function to generate access (15min) and refresh (7 days) tokens
- [x] Add refresh function in auth.controller.js to verify refresh token and issue new access token
- [x] Add logout function in auth.controller.js to invalidate refresh token
- [x] Update auth.routes.js to include /refresh and /logout routes
- [x] Test the implementation (run the app and verify endpoints)
- [x] Add JWT_REFRESH_SECRET to .env file (required for refresh tokens)

# TODO: Add Real-Time Messaging with Socket.IO

- [x] Install socket.io dependency
- [x] Create src/sockets/socket.js for socket event handling
- [x] Modify src/app.js to integrate Socket.IO server
- [x] Update src/controllers/message.controller.js to emit messages via socket
- [x] Add real-time notifications for new messages (including typing indicators)
- [x] Test real-time messaging functionality (server starts successfully on port 5001)
