const mongoose = require('mongoose')
const Topic = require('../models/Topic')
mongoose.connect('mongodb://localhost/hnmail')
;(async () => {
  const topics = await Topic.find({}).exec()
  console.log(topics)
})()
