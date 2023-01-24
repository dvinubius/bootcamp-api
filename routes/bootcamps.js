import express from 'express'
import {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
  registerForBootcamp,
} from '../controllers/bootcamps.js'
// Include other resource routers
import courseRouter from './courses.js'
import reviewRouter from './reviews.js'
import Bootcamp from '../models/Bootcamp.js'
import advancedResults from '../middleware/advancedResults.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// Reroute into other resource routers
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)

// prettier-ignore
router.route('/')
  .get(advancedResults(Bootcamp,
    [{ path: 'courses', select: 'title weeks tuition' },
    { path: 'participants', select: 'name email' }]
  ), getBootcamps)
  .post(protect, authorize('publisher', 'admin'), createBootcamp)

// prettier-ignore
router.route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorize('publisher', 'admin'), deleteBootcamp)

router
  .route('/:id/register')
  .post(protect, authorize('admin'), registerForBootcamp)

router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload)

export default router
