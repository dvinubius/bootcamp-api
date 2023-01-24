import mongoose from 'mongoose'

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a course title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  weeks: {
    type: String,
    required: [true, 'Please add number of weeks'],
  },
  tuition: {
    type: Number,
    required: [true, 'Please add a tuition cost'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'Please add a minimum skill'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
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
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
})

// get average of course tuitions
CourseSchema.statics.updateAverageCost = async function (bootcampId) {
  const pipeline = [
    // step 1
    {
      $match: { bootcamp: bootcampId },
    },
    // step 2
    {
      $group: {
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' },
      },
    },
  ]
  // "this" is the Model
  const agg = await this.aggregate(pipeline)

  try {
    if (agg[0]) {
      await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
        averageCost: Math.ceil(agg[0].averageCost / 10) * 10,
      })
    } else {
      await this.model('Bootcamp').updateOne(
        { _id: bootcampId },
        {
          $unset: { averageCost: '' },
        }
      )
    }
  } catch (e) {
    console.error(e)
  }
}

// average cost after save
CourseSchema.post('save', function () {
  // "this" is the course entity, "this.contstructor" is the Model
  this.constructor.updateAverageCost(this.bootcamp)
})

// average cost after remove
CourseSchema.post('remove', function () {
  this.constructor.updateAverageCost(this.bootcamp)
})

CourseSchema.post('findOneAndUpdate', async function () {
  const doc = await this.model.findOne(this.getQuery())
  this.model.updateAverageCost(doc.bootcamp)
})

const model = mongoose.model('Course', CourseSchema)
export default model
