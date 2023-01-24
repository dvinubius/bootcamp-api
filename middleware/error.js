import ErrorResponse from '../utils/error-response.js'

export default (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message
  // for dev
  console.log(err.stack.red)
  if (err.name === 'CastError') {
    const message = `Resource not found`
    error = new ErrorResponse(message, 404)
  }
  // mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new ErrorResponse(message, 400)
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((v) => v.message)
    error = new ErrorResponse(message, 400)
  }
  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message || 'Server Error' })
}
