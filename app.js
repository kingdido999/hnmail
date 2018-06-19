const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const serve = require('koa-static')
const views = require('koa-views')
const koaBody = require('koa-body')
const mongoose = require('mongoose')
const schedule = require('node-schedule')
const _ = require('lodash')
const nanoid = require('nanoid')
const User = require('./models/User')
const Topic = require('./models/Topic')
const Mailer = require('./Mailer')
const { isLocal } = require('./.env')

mongoose.connect('mongodb://localhost/hnmail')

const app = new Koa()

app.use(serve('assets'))
app.use(views(path.join(__dirname, '/views'), { extension: 'pug' }))
app.use(koaBody())

const router = new Router()

router.get('/', async ctx => {
  await ctx.render('pages/home')
})

router.get('/sample', async ctx => {
  const topics = require('./sample-topics')
  await ctx.render('pages/sample', { topics })
})

router.post('/subscribe', async ctx => {
  const { email, topics } = ctx.request.body
  const topicList = topics.split(',').map(topic => topic.trim().toLowerCase())
  const topicString = topicList.join(', ').toUpperCase()
  let user = await User.findOne({ email }).exec()
  const token = nanoid()

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
          link: `${isLocal ? 'http://localhost:3000' : 'https://hnmail.io'}/update?email=${email}&topics=${topics}&token=${token}`
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
          link: `${isLocal ? 'http://localhost:3000' : 'https://hnmail.io'}/verify?email=${email}&topics=${topics}&token=${token}`
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
    await user.save()

    topicList.forEach(async name => {
      let topic = await Topic.findOne({ name }).exec()

      if (topic) {
        console.log(`Topic ${name} already exists.`)
        topic.subscriber_ids.push(user.id)
      } else {
        console.log(`Saving topic: ${name}`)
        topic = new Topic({ name, subscriber_ids: [user.id] })
      }

      await topic.save()
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
    user.topics = topicList
    await user.save()

    topicList.forEach(async name => {
      let topic = await Topic.findOne({ name }).exec()

      if (topic) {
        console.log(`Topic ${name} already exists.`)

        if (!user.topics.includes(topic)) {
          topic.subscriber_ids.push(user.id)
        }
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

app.use(router.routes())
app.use(router.allowedMethods())

const PORT = 3000
app.listen(PORT)
console.log(`Listening on port: ${PORT}`)

// Every Friday at 8AM
// 1. Get all topics from DB.
// 2. Use HackerNewsCrawler to fetch articles for all topics.
// 3. Get each user's topics, select all related articles and send email.
schedule.scheduleJob('0 8 * * 5', sendNewsletters)

async function sendNewsletters () {
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
}
