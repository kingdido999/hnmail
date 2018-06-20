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
const Mailer = require('./services/Mailer')
const HackerNewsMailer = require('./services/HackerNewsMailer')
const { isLocal } = require('./.env')

mongoose.connect('mongodb://localhost/hnmail')
const DOMAIN = isLocal ? 'http://localhost:3000' : 'https://hnmail.io'

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
    user.is_subscribed = true
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

router.get('/unsubscribe', async ctx => {
  const { email, token } = ctx.request.query
  const user = await User.findOne({ email, token }).exec()

  if (user) {
    user.is_subscribed = false
    await user.save()
    await ctx.render('pages/unsubscribed', {
      email
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
schedule.scheduleJob('0 8 * * 5', HackerNewsMailer.sendNewsletters)
