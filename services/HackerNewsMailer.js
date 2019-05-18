const mongoose = require('mongoose')
const R = require('ramda')
const Topic = require('../models/Topic')
const User = require('../models/User')
const Newsletter = require('../models/Newsletter')
const HackerNewsCrawler = require('./HackerNewsCrawler')
const Mailer = require('./Mailer')
const _ = require('lodash')
const { isLocal } = require('../.env')
const DOMAIN = isLocal ? 'http://localhost:3000' : 'https://hnmail.io'

class HackerNewsMailer {
  // 1. Get all topics from DB.
  // 2. Use HackerNewsCrawler to fetch articles for all topics.
  // 3. Get each user's topics, select all related articles and send email.
  static async sendNewsletters () {
    mongoose.connect('mongodb://localhost/hnmail')

    const topics = await Topic.find({
      subscriber_ids: { $not: { $size: 0 } }
    }).exec()

    const users = await User.find({
      is_verified: true,
      is_subscribed: true
    }).exec()

    const topicNames = topics.map(topic => topic.name)
    let results

    try {
      results = await HackerNewsCrawler.fetchArticlesByTopics(topicNames)
    } catch (err) {
      console.error('Failed to fetch articles.')
      throw err
    }

    users.forEach(async user => {
      const userTopics = R.pickAll(user.topics, results)
      const subject = getRandomTitleFromTopics(userTopics)
      const newsletter = new Newsletter({
        subject,
        topics: userTopics,
        subscriber_id: user.id
      })
      await newsletter.save()

      console.log('Sending newsletter to %s', user.email)
      await Mailer.send({
        to: user.email,
        subject,
        template: {
          name: 'views/emails/newsletter.pug',
          engine: 'pug',
          context: {
            topics: userTopics,
            unsubLink: `${DOMAIN}/unsubscribe?email=${user.email}&token=${user.token}`,
            showAds: false
          }
        }
      })
      console.log('Sending newsletter complete.')
    })
  }
}

function getRandomTitleFromTopics (topics) {
  const nonEmptyTopics = R.filter(topic => topic.length > 0, topics)
  if (Object.keys(nonEmptyTopics).length > 0) {
    return _.sample(nonEmptyTopics)[0].title
  } else {
    return 'Please Update Your HN Mail Topics'
  }
}

module.exports = HackerNewsMailer
