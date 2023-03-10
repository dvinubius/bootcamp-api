import Course from '../models/Course.js'
import ErrorResponse from '../utils/error-response.js'
import asyncHandler from '../middleware/async.js'
import Bootcamp from '../models/Bootcamp.js'

// @desc  Get all courses
// @route GET /api/v1/courses
// @route GET /api/v1/bootcamps/:bootcampId/courses/
// @access Public
export const getCourses = asyncHandler(async (req, res, next) => {
  const bcId = req.params.bootcampId
  if (bcId) {
    const courses = await Course.find({ bootcamp: bcId })
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    })
  }
  res.status(200).json(res.advancedResults)
})

// @desc  Get single course
// @route GET /api/v1/courses/:id
// @access Public
export const getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  })
  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    )
  }
  res.status(200).json({ success: true, data: course })
})

// @desc  Add course to bootcamp
// @route POST /api/v1/bootcamps/:bootcampId/courses
// @access Private
export const addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId
  req.body.owner = req.user.id

  const bootcamp = await Bootcamp.findById(req.params.bootcampId)

  if (!bootcamp) {
    return next(new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404))
  }

  if (req.user.role !== 'admin' && bootcamp.owner.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`
      ),
      401
    )
  }

  const course = await Course.create(req.body)

  res.status(201).json({ success: true, data: course })
})

// @desc  Update course
// @route PUT /api/v1/courses/:id
// @access Private
export const updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id)

  if (!course) {
    return next(new ErrorResponse(`No course with id ${req.params.id}`, 404))
  }

  if (req.user.role !== 'admin' && course.owner.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update course ${course._id}`
      ),
      401
    )
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    validators: true,
  })

  res.status(200).json({ success: true, data: course })
})

// @desc  Delete course
// @route DELTE /api/v1/courses/:id
// @access Private
export const deleteCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id)

  if (!course) {
    return next(new ErrorResponse(`No course with id ${req.params.id}`, 404))
  }

  if (req.user.role !== 'admin' && course.owner.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete course ${course._id}`
      ),
      401
    )
  }

  await course.remove()

  res.status(204).json({ success: true, data: {} })
})
