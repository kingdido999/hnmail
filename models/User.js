const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  token: {
    type: String
  },
  topics: {
    type: [String]
  },
  is_verified: {
    type: Boolean,
    default: false
  }
})

userSchema.set('timestamps', true)

module.exports = mongoose.model('User', userSchema)
