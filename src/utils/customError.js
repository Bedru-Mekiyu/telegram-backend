class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends CustomError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends CustomError {
  constructor(message) {
    super(message, 404);
  }
}

class ForbiddenError extends CustomError {
  constructor(message) {
    super(message, 403);
  }
}

class UnauthorizedError extends CustomError {
  constructor(message) {
    super(message, 401);
  }
}

module.exports = {
  CustomError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError
};