const mongoose = require('mongoose')

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  }
})

topicSchema.set('timestamps', true)

module.exports = mongoose.model('Topic', topicSchema)
