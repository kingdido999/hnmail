const R = require('ramda')
const nanoid = require('nanoid')
const User = require('./models/User')
const Topic = require('./models/Topic')
const Mailer = require('./services/Mailer')
const HNCrawler = require('./services/HackerNewsCrawler')
const { testEmailAddress, isLocal } = require('../.env')
const DOMAIN = isLocal ? `http://localhost:3000` : 'https://hnmail.io'

const INVALID_TOPICS_ERROR =
  'Topics must not contain numbers or special characters other than ","'
const TOO_MANY_TOPICS_ERROR = 'Number of topics should not be more than 5'

const isInvalidTopics = (topics) => {
  return /[`!@#$%^&*()_+\-=\[\]{};':"\\|.<>\/?~\d]/.test(topics)
}

module.exports = function (router) {
  router.get('/', async (ctx) => {
    const topics = await Topic.find({
      subscriber_ids: { $not: { $size: 0 } },
    }).exec()

    const hotTopics = topics
      .sort((a, b) => b.subscriber_ids.length - a.subscriber_ids.length)
      .slice(0, 20)

    await ctx.render('pages/home', {
      topics: hotTopics,
      topicsCount: topics.length,
      error: ctx.session.error,
    })

    ctx.session.error = {}
  })

  router.get('/sample', async (ctx, next) => {
    const { topics } = ctx.request.query

    if (!topics) {
      ctx.redirect('/#subscribe')
      return next()
    }

    if (isInvalidTopics(topics)) {
      ctx.session.error = {
        message: INVALID_TOPICS_ERROR,
      }

      ctx.redirect('/#subscribe')
      return next()
    }

    const topicList = topics
      .split(',')
      .map((topic) => topic.trim().toLowerCase())

    if (topicList.length > 5) {
      ctx.session.error = {
        message: TOO_MANY_TOPICS_ERROR,
      }
      ctx.redirect('/#subscribe')
      return next()
    }

    const res = await HNCrawler.fetchArticlesByTopics(topicList)

    await ctx.render('pages/sample', {
      topics: res,
      domain: DOMAIN,
    })
  })

  router.get('/topics', async (ctx) => {
    const topics = await Topic.find({
      subscriber_ids: { $not: { $size: 0 } },
    }).exec()

    await ctx.render('pages/topics', {
      topics: topics.sort(
        (a, b) => b.subscriber_ids.length - a.subscriber_ids.length
      ),
      domain: DOMAIN,
    })
  })

  router.get('/topics/:name', async (ctx) => {
    const { name } = ctx.params

    const res = await HNCrawler.fetchArticlesByTopics([name])

    await ctx.render('pages/sample', {
      topics: res,
      domain: DOMAIN,
    })
  })

  router.post('/subscribe', async (ctx, next) => {
    const { email, topics } = ctx.request.body

    if (email === '') {
      ctx.session.error = {
        message: 'Please fill out your Email',
      }
      ctx.redirect('/#subscribe')
      return next()
    }

    if (isInvalidTopics(topics)) {
      ctx.session.error = {
        message: INVALID_TOPICS_ERROR,
      }
      ctx.redirect('/#subscribe')
      return next()
    }

    const topicList = topics
      .split(',')
      .map((topic) => topic.trim().toLowerCase())

    if (topicList.length > 5) {
      ctx.session.error = {
        message: TOO_MANY_TOPICS_ERROR,
      }
      ctx.redirect('/#subscribe')
      return next()
    }

    const topicString = topicList.join(', ').toUpperCase()
    let user = await User.findOne({ email }).exec()
    const token = nanoid()
    const unsubLink = `${DOMAIN}/unsubscribe?email=${email}&token=${token}`
    const escapedEmail = email.replace('+', encodeURIComponent('+'))

    if (user) {
      user.token = token
      await user.save()

      const link = `${DOMAIN}/update?email=${escapedEmail}&topics=${topics}&token=${token}`

      await Mailer.send({
        to: email,
        subject: 'Please Verify Your Topics Update',
        template: {
          name: 'src/views/emails/update.pug',
          engine: 'pug',
          context: {
            topics: topicString,
            link,
            unsubLink,
          },
        },
      })
      await ctx.render('pages/update-verification', {
        email,
        topics: topicString,
      })
    } else {
      user = new User({ email, token })
      await user.save()

      const link = `${DOMAIN}/verify?email=${escapedEmail}&topics=${topics}&token=${token}`

      await Mailer.send({
        to: email,
        subject: 'Please Verify Your Account',
        template: {
          name: 'src/views/emails/verification.pug',
          engine: 'pug',
          context: {
            link,
            unsubLink,
          },
        },
      })

      await ctx.render('pages/verification', {
        email,
        topics: topicString,
      })
    }
  })

  router.get('/verify', async (ctx) => {
    const { email, topics, token } = ctx.request.query
    const user = await User.findOne({ email, token }).exec()

    if (user) {
      const topicList = topics
        .split(',')
        .map((topic) => topic.trim().toLowerCase())
      user.topics = topicList
      user.is_verified = true
      user.is_subscribed = true
      await user.save()

      topicList.forEach(async (name) => {
        let topic = await Topic.findOne({ name }).exec()

        if (topic) {
          topic.subscriber_ids = R.uniq([...topic.subscriber_ids, user.id])
        } else {
          topic = new Topic({ name, subscriber_ids: [user.id] })
        }

        await topic.save()
      })

      const topicString = topicList.join(', ').toUpperCase()
      const subscribers = await User.find({
        is_verified: true,
        is_subscribed: true,
      }).exec()

      await Mailer.send({
        to: testEmailAddress,
        subject: 'New user joined',
        text: `Email: ${email} \r\nTopics: ${topicString} \r\nTotal subscribers: ${subscribers.length}`,
      })

      await ctx.render('pages/welcome', {
        topics: topicList.join(', ').toUpperCase(),
      })
    } else {
      ctx.status = 401
    }
  })

  router.get('/update', async (ctx) => {
    const { email, topics, token } = ctx.request.query
    const user = await User.findOne({ email, token }).exec()

    if (user) {
      const topicList = topics
        .split(',')
        .map((topic) => topic.trim().toLowerCase())
      const topicsToBeRemoved = R.difference(user.topics, topicList)

      topicsToBeRemoved.forEach(async (name) => {
        const topic = await Topic.findOne({ name }).exec()
        topic.subscriber_ids = R.without([user.id], topic.subscriber_ids)
        await topic.save()
      })

      user.topics = topicList
      user.is_subscribed = true
      await user.save()

      topicList.forEach(async (name) => {
        let topic = await Topic.findOne({ name }).exec()

        if (topic) {
          topic.subscriber_ids = R.uniq([...topic.subscriber_ids, user.id])
        } else {
          topic = new Topic({ name, subscriber_ids: [user.id] })
        }

        await topic.save()
      })

      await ctx.render('pages/update-complete', {
        topics: topicList.join(', ').toUpperCase(),
      })
    } else {
      ctx.status = 401
    }
  })

  router.get('/unsubscribe', async (ctx) => {
    const { email, token } = ctx.request.query
    const user = await User.findOne({ email, token }).exec()

    if (user) {
      user.topics.forEach(async (name) => {
        const topic = await Topic.findOne({ name }).exec()
        topic.subscriber_ids = R.without([user.id], topic.subscriber_ids)
        await topic.save()
      })

      user.topics = []
      user.is_subscribed = false
      await user.save()
      await ctx.render('pages/unsubscribed', {
        email,
      })
    } else {
      ctx.status = 401
    }
  })
}
