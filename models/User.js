import crypto from 'crypto'
import mongoose from 'mongoose-fill'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      required: [true, 'Please add an email'],
      unique: true,
    },
    role: {
      type: String,
      enum: ['user', 'publisher'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    resetPasswordToken: String,
    resetPassowdExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

UserSchema.methods.getSignedJwt = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
}

UserSchema.methods.matchUserEnteredPwd = async function (userEnteredPwd) {
  return await bcrypt.compare(userEnteredPwd, this.password)
}

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// cascade delete bootcamps when owner is deleted
UserSchema.pre('remove', async function (next) {
  // "this" refers to deleted course
  await this.model('Bootcamp').deleteMany({ owner: this._id })
  next()
})

// Reverse populate with virtuals
UserSchema.virtual('bootcampsOwned', {
  ref: 'Bootcamp',
  localField: '_id',
  foreignField: 'owner',
  justOne: false,
})

UserSchema.fill('bootcampsJoined', function (callback) {
  this.model('Bootcamp')
    .find({
      participants: this.id,
    })
    .select('name')
    .exec(callback)
})

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex')
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  this.resetPassowdExpire = Date.now() + 10 * 60 * 1000
  return resetToken
}

const model = mongoose.model('User', UserSchema)
export default model
