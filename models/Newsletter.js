const mongoose = require('mongoose')

const newsletterSchema = new mongoose.Schema({
  subscriber_id: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topics: {
    type: Object,
    required: true
  }
})

newsletterSchema.set('timestamps', true)

module.exports = mongoose.model('Newsletter', newsletterSchema)
