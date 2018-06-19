const mongoose = require('mongoose')
const R = require('ramda')
const Topic = require('../models/Topic')
const User = require('../models/User')
const HackerNewsCrawler = require('../HackerNewsCrawler')
const Mailer = require('../Mailer')
const _ = require('lodash')

mongoose.connect('mongodb://localhost/hnmail')
;(async () => {
  const topics = await Topic.find({}).exec()
  const users = await User.find({ is_verified: true }).exec()
  const topicNames = topics.map(topic => topic.name)
  const hnCrawler = new HackerNewsCrawler()

  try {
    const results = await hnCrawler.fetchArticlesByTopics(topicNames)
    users.forEach(async user => {
      const userTopics = R.pickAll(user.topics, results)
      const subject = _.sample(userTopics)[0].title
      await Mailer.send({
        to: user.email,
        subject,
        template: {
          name: 'views/emails/newsletter.pug',
          engine: 'pug',
          context: {
            topics: userTopics
          }
        }
      })
    })
  } catch (err) {
    console.log(err)
  }
})()
