import Review from '../models/Review.js'
import ErrorResponse from '../utils/error-response.js'
import asyncHandler from '../middleware/async.js'
import Bootcamp from '../models/Bootcamp.js'

// @desc  Get all reviews
// @route GET /api/v1/reviews
// @route GET /api/v1/bootcamps/:bootcampId/reviews/
// @access Public
export const getReviews = asyncHandler(async (req, res, next) => {
  const bcId = req.params.bootcampId
  if (bcId) {
    const reviews = await Review.find({ bootcamp: bcId })
    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    })
  }
  res.status(200).json(res.advancedResults)
})

// @desc  Get single review
// @route GET /api/v1/reviews/:id
// @access Public
export const getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  })
  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    )
  }
  res.status(200).json({ success: true, data: review })
})

// @desc  Add revkew to bootcamp
// @route POST /api/v1/bootcamps/:bootcampId/reviews
// @access Private
export const addReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId
  req.body.author = req.user.id

  const bootcamp = await Bootcamp.findById(req.params.bootcampId)

  if (!bootcamp) {
    return next(new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404))
  }

  const isParticipant = bootcamp.participants.includes(req.user.id)

  if (req.user.role !== 'admin' && !isParticipant) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a review to bootcamp ${bootcamp._id}`
      ),
      401
    )
  }

  const review = await Review.create(req.body)

  res.status(201).json({ success: true, data: review })
})

// @desc  Update review
// @route PUT /api/v1/reviews/:id
// @access Private
export const updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id)

  if (!review) {
    return next(new ErrorResponse(`No review with id ${req.params.id}`, 404))
  }

  if (req.user.role !== 'admin' && req.user.id !== review.author) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update review ${review._id}`
      ),
      401
    )
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    validators: true,
  })

  res.status(200).json({ success: true, data: review })
})

// @desc  Delete review
// @route DELTE /api/v1/reviews/:id
// @access Private
export const deleteReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id)

  if (!review) {
    return next(new ErrorResponse(`No review with id ${req.params.id}`, 404))
  }

  if (req.user.role !== 'admin' && req.user.id !== review.author) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete review ${review._id}`
      ),
      401
    )
  }

  await review.remove()

  res.status(204).json({ success: true, data: {} })
})
