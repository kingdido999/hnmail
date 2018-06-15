const mongoose = require('mongoose')
const Topic = require('../models/Topic')
const HackerNewsCrawler = require('../HackerNewsCrawler')
mongoose.connect('mongodb://localhost/hnmail')
;(async () => {
  const topics = await Topic.find({}).exec()
  const topicNames = topics.map(topic => topic.name)
  const hnCrawler = new HackerNewsCrawler()

  try {
    const results = await hnCrawler.fetchArticlesByTopics(topicNames)
  } catch (err) {
    console.log(err)
  }
})()
