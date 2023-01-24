import path from 'path'
import Bootcamp from '../models/Bootcamp.js'
import User from '../models/User.js'
import ErrorResponse from '../utils/error-response.js'
import asyncHandler from '../middleware/async.js'
import geocoder from '../utils/geocoder.js'

// @desc  Get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
export const getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc  Get single bootcamp
// @route GET /api/v1/bootcamps/:id
// @access Public
export const getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)
    .populate({ path: 'courses', select: 'title weeks tuition' })
    .populate({ path: 'participants', select: 'name email' })
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    )
  }
  res.status(200).json({ success: true, data: bootcamp })
})

// @desc  Create bootcamp
// @route POST /api/v1/bootcamps
// @access Private
export const createBootcamp = asyncHandler(async (req, res, next) => {
  // add owner
  req.body.owner = req.user.id

  // check no other bootcamp is published yet (max 1 bootcamp per owner)
  const publishedBootcamp = await Bootcamp.findOne({ owner: req.user.id })
  if (publishedBootcamp && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with id ${req.user.id} has already published a bootcamp`
      )
    )
  }

  const bootcamp = await Bootcamp.create(req.body)
  res.status(201).json({ success: true, data: bootcamp })
})

// @desc  Update bootcamp
// @route POST /api/v1/bootcamps/:id
// @access Private
export const updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 400)
    )
  }

  if (req.user.role !== 'admin' && bootcamp.owner.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this bootcamp`
      ),
      401
    )
  }
  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  res.status(200).json({ success: true, data: bootcamp })
})

// @desc  Register for bootcamp
// @route POST /api/v1/bootcamps/:id/register
// @access Private
export const registerForBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 400)
    )
  }
  const userId = req.body.user
  const user = await User.findById(userId)
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 400))
  }

  if (bootcamp.participants.includes(userId)) {
    return next(
      new ErrorResponse(
        `User ${req.body} already registered for bootcamp ${req.params.id}`,
        400
      )
    )
  }

  bootcamp.address = bootcamp.location.formattedAddress
  bootcamp.participants.push(userId), await bootcamp.save()
  res.status(200).json({ success: true, data: bootcamp })
})

// @desc  Delete bootcamp
// @route DELETE /api/v1/bootcamps/:id
// @access Private
export const deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 400)
    )
  }
  if (req.user.role !== 'admin' && bootcamp.owner.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this bootcamp`
      ),
      401
    )
  }
  bootcamp.remove()
  res.status(204).json({ success: true })
})

// @desc      Get bootcamps within a radius
// @route     GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access    Private
export const getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode)
  const lat = loc[0].latitude
  const lng = loc[0].longitude

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  })

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  })
})

// @desc  Upload photo for bootcamp
// @route PUT /api/v1/bootcamps/:id/photo
// @access Private
export const bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    )
  }

  if (req.user.role !== 'admin' && bootcamp.owner.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this bootcamp`
      ),
      401
    )
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400))
  }

  const file = req.files.file
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400))
  }

  const maxSize = process.env.MAX_FILE_UPLOAD
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(`Please upload an image less than ${maxSize}`, 400)
    )
  }

  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err)
      return next(new ErrorResponse('Problem with file upload', 500))
    }
    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })
    res.status(200).json({ success: true, data: file.name })
  })
})
