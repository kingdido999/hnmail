const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  topics: {
    type: [String]
  }
})

userSchema.set('timestamps', true)

module.exports = mongoose.model('User', userSchema)
