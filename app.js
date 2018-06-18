const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const serve = require('koa-static')
const views = require('koa-views')
const koaBody = require('koa-body')
const mongoose = require('mongoose')
const schedule = require('node-schedule')
const _ = require('lodash')
const User = require('./models/User')
const Topic = require('./models/Topic')

mongoose.connect('mongodb://localhost/hnmail')

const app = new Koa()

app.use(serve('assets'))
app.use(views(path.join(__dirname, '/views'), { extension: 'pug' }))
app.use(koaBody())

const router = new Router()

router.get('/', async ctx => {
  await ctx.render('pages/index')
})

router.get('/sample', async ctx => {
  const topics = require('./sample-topics')
  await ctx.render('pages/sample', { topics })
})

router.get('/welcome', async ctx => {
  await ctx.render('pages/welcome')
})

router.post('/subscribe', async ctx => {
  const { email, topics } = ctx.request.body
  const topicList = topics.split(',').map(topic => topic.trim().toLowerCase())

  let user = await User.findOne({ email }).exec()
  let isNewUser = false

  if (user) {
    console.log('User with email: %s already exsits.', email)
    await User.update({ email }, { topics: topicList }).exec()
  } else {
    isNewUser = true
    console.log('Saving user with email: %s', email)
    user = new User({ email, topics: topicList })
    await user.save()
  }

  topicList.forEach(async name => {
    let topic = await Topic.findOne({ name }).exec()

    if (topic) {
      console.log(`Topic ${name} already exists.`)

      if (isNewUser) {
        topic.subscriber_ids.push(user.id)
        await topic.save()
      }
    } else {
      console.log(`Saving topic: ${name}`)
      topic = new Topic({ name, subscriber_ids: [user.id] })
      await topic.save()
    }
  })

  ctx.redirect('/welcome')
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
schedule.scheduleJob('0 8 * * 5', sendEmails)

async function sendEmails () {
  const topics = await Topic.find({}).exec()
  const users = await User.find({}).exec()
  const topicNames = topics.map(topic => topic.name)
  const hnCrawler = new HackerNewsCrawler()
  const mailer = new Mailer()

  try {
    const results = await hnCrawler.fetchArticlesByTopics(topicNames)
    users.forEach(async user => {
      const userTopics = R.pickAll(user.topics, results)
      const subject = _.sample(userTopics)[0].title
      await mailer.send(user.email, subject, { topics: userTopics })
    })
  } catch (err) {
    console.log(err)
  }
}
