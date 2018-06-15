const mongoose = require('mongoose')

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  subscriber_ids: {
    type: [String]
  }
})

topicSchema.set('timestamps', true)

module.exports = mongoose.model('Topic', topicSchema)
