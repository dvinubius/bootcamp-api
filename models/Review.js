import mongoose from 'mongoose'

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a review title'],
    maxLength: 100,
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'Please add a rating between 1 and 10'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
})

// prevents user from posting multiple reviews per bootcamp
ReviewSchema.index({ bootcamp: 1, author: 1 }, { unique: true })

// get average of review ratings per bootcamp
ReviewSchema.statics.updateAverageRating = async function (bootcampId) {
  const pipeline = [
    // step 1
    {
      $match: { bootcamp: bootcampId },
    },
    // step 2
    {
      $group: {
        _id: '$bootcamp',
        averageRating: { $avg: '$rating' },
      },
    },
  ]
  // "this" is the Model
  const agg = await this.aggregate(pipeline)

  try {
    if (agg[0]) {
      await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
        averageRating: agg[0].averageRating,
      })
    } else {
      await this.model('Bootcamp').updateOne(
        { _id: bootcampId },
        {
          $unset: { averageRating: '' },
        }
      )
    }
  } catch (e) {
    console.error(e)
  }
}

// average review after save
ReviewSchema.post('save', function () {
  // "this" is the course entity, "this.constructor" is the Model
  this.constructor.updateAverageRating(this.bootcamp)
})

// average rating after remove
ReviewSchema.post('remove', function () {
  this.constructor.updateAverageRating(this.bootcamp)
})

ReviewSchema.post('findOneAndUpdate', async function () {
  const doc = await this.model.findOne(this.getQuery())
  this.model.updateAverageRating(doc.bootcamp)
})

const model = mongoose.model('Review', ReviewSchema)
export default model
