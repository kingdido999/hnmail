const mongoose = require('mongoose')
const Topic = require('../models/Topic')
mongoose.connect('mongodb://localhost/hnmail')
;(async () => {
  const topics = await Topic.find({}).exec()
  const topicNames = topics.map(topic => topic.name)
  console.log('topicNames: %o', topicNames)
  const hnCrawler = new HackerNewsCrawler(true)

  try {
    const results = await hnCrawler.fetchArticlesByTopics(topicNames)
    console.log(results)
  } catch (err) {
    console.log(err)
  }
})()
