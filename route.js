const _ = require('lodash')
const R = require('ramda')
const nanoid = require('nanoid')
const User = require('./models/User')
const Topic = require('./models/Topic')
const Newsletter = require('./models/Newsletter')
const Mailer = require('./services/Mailer')
const { testEmailAddress, isLocal } = require('./.env')
const DOMAIN = isLocal ? `http://localhost:3000` : 'https://hnmail.io'

module.exports = function (router) {
  router.get('/', async ctx => {
    const topics = await Topic.find({
      subscriber_ids: { $not: { $size: 0 } }
    }).exec()

    const newsletters = await Newsletter.find({}).exec()
    const subscribers = await User.find({
      is_verified: true,
      is_subscribed: true
    }).exec()

    const hotTopics = topics
      .sort((a, b) => b.subscriber_ids.length - a.subscriber_ids.length)
      .slice(0, 20)

    await ctx.render('pages/home', {
      topics: hotTopics,
      topicsCount: topics.length,
      newsletterCount: newsletters.length,
      subscriberCount: subscribers.length,
      error: ctx.session.error
    })

    ctx.session.error = {}
  })

  router.get('/sample', async ctx => {
    const user = await User.findOne({ email: testEmailAddress }).exec()
    const newsletter = await Newsletter
      .find({ subscriber_id: user.id })
      .limit(1)
      .sort({ $natural: -1 })
      .exec()
    
    await ctx.render('pages/sample', { topics: newsletter[0].topics })
  })

  router.get('/topics', async ctx => {
    const topics = await Topic.find({
      subscriber_ids: { $not: { $size: 0 } }
    }).exec()


    await ctx.render('pages/topics', {
      topics: topics.sort((a, b) => b.subscriber_ids.length - a.subscriber_ids.length)
    })
  })

  router.post('/subscribe', async (ctx, next) => {
    const { email, topics } = ctx.request.body
    const topicList = topics.split(',').map(topic => topic.trim().toLowerCase())

    if (topicList.length > 5) {
      ctx.session.error = {
        message: 'Number of topics should not be more than 5.'
      }
      ctx.redirect('/')
      return next()
    }

    const topicString = topicList.join(', ').toUpperCase()
    let user = await User.findOne({ email }).exec()
    const token = nanoid()
    const unsubLink = `${DOMAIN}/unsubscribe?email=${email}&token=${token}`

    if (user) {
      console.log('User with email: %s already exsits.', email)
      user.token = token
      await user.save()
      await Mailer.send({
        to: email,
        subject: 'Please Verify Your HN Mail Update',
        template: {
          name: 'views/emails/update.pug',
          engine: 'pug',
          context: {
            topics: topicString,
            link: `${DOMAIN}/update?email=${email}&topics=${topics}&token=${token}`,
            unsubLink
          }
        }
      })
      await ctx.render('pages/update-verification', {
        email,
        topics: topicString
      })
    } else {
      console.log('Saving user with email: %s', email)
      user = new User({ email, token })
      await user.save()
      await Mailer.send({
        to: email,
        subject: 'Please Verify Your HN Mail Account',
        template: {
          name: 'views/emails/verification.pug',
          engine: 'pug',
          context: {
            link: `${DOMAIN}/verify?email=${email}&topics=${topics}&token=${token}`,
            unsubLink
          }
        }
      })

      await ctx.render('pages/verification', {
        email,
        topics: topicString
      })
    }
  })

  router.get('/verify', async ctx => {
    const { email, topics, token } = ctx.request.query
    const user = await User.findOne({ email, token }).exec()

    if (user) {
      const topicList = topics.split(',').map(topic => topic.trim().toLowerCase())
      user.topics = topicList
      user.is_verified = true
      user.is_subscribed = true
      await user.save()

      topicList.forEach(async name => {
        let topic = await Topic.findOne({ name }).exec()

        if (topic) {
          console.log(`Topic ${name} already exists.`)
          topic.subscriber_ids = R.uniq([...topic.subscriber_ids, user.id])
        } else {
          console.log(`Saving topic: ${name}`)
          topic = new Topic({ name, subscriber_ids: [user.id] })
        }

        await topic.save()
      })
      
      const topicString = topicList.join(', ').toUpperCase()
      const subscribers = await User.find({
        is_verified: true,
        is_subscribed: true
      }).exec()

      await Mailer.send({
        to: testEmailAddress,
        subject: `New user joined HN Mail`,
        text: `Email: ${email} \r\nTopics: ${topicString} \r\nTotal subscribers: ${subscribers.length}`
      })

      await ctx.render('pages/welcome', {
        topics: topicList.join(', ').toUpperCase()
      })
    } else {
      ctx.status = 401
    }
  })

  router.get('/update', async ctx => {
    const { email, topics, token } = ctx.request.query
    const user = await User.findOne({ email, token }).exec()

    if (user) {
      const topicList = topics.split(',').map(topic => topic.trim().toLowerCase())
      const topicsToBeRemoved = R.difference(user.topics, topicList)

      topicsToBeRemoved.forEach(async name => {
        const topic = await Topic.findOne({ name }).exec()
        topic.subscriber_ids = R.without([user.id], topic.subscriber_ids)
        await topic.save()
      })

      user.topics = topicList
      user.is_subscribed = true
      await user.save()

      topicList.forEach(async name => {
        let topic = await Topic.findOne({ name }).exec()

        if (topic) {
          console.log(`Topic ${name} already exists.`)
          topic.subscriber_ids = R.uniq([...topic.subscriber_ids, user.id])
        } else {
          console.log(`Saving topic: ${name}`)
          topic = new Topic({ name, subscriber_ids: [user.id] })
        }

        await topic.save()
      })

      await ctx.render('pages/update-complete', {
        topics: topicList.join(', ').toUpperCase()
      })
    } else {
      ctx.status = 401
    }
  })

  router.get('/unsubscribe', async ctx => {
    const { email, token } = ctx.request.query
    const user = await User.findOne({ email, token }).exec()

    if (user) {
      user.topics.forEach(async name => {
        const topic = await Topic.findOne({ name }).exec()
        topic.subscriber_ids = R.without([user.id], topic.subscriber_ids)
        await topic.save()
      })

      user.topics = []
      user.is_subscribed = false
      await user.save()
      await ctx.render('pages/unsubscribed', {
        email
      })
    } else {
      ctx.status = 401
    }
  })
}
