const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const views = require('koa-views')
const koaBody = require('koa-body')
const mongoose = require('mongoose')
const schedule = require('node-schedule')
const User = require('./models/User')
const Topic = require('./models/Topic')

mongoose.connect('mongodb://localhost/hnmail')

const app = new Koa()

app.use(views(path.join(__dirname, '/views'), { extension: 'ejs' }))
app.use(koaBody())

const router = new Router()

router.get('/', async ctx => {
  await ctx.render('pages/index')
})

router.post('/subscribe', async ctx => {
  const { email, topics } = ctx.request.body
  const topicList = topics.split(',').map(topic => topic.trim())

  let user = await User.findOne({ email }).exec()

  if (user) {
    console.log('User with email: %s already exsits.', email)
    await User.update({ email }, { topics: topicList }).exec()
  } else {
    console.log('Saving user with email: %s', email)
    user = new User({ email, topics: topicList })
    await user.save()
  }

  topicList.forEach(async name => {
    let topic = await Topic.findOne({ name }).exec()

    if (topic) {
      console.log(`Topic ${name} already exists.`)
    } else {
      console.log(`Saving topic: ${name}`)
      topic = new Topic({ name })
      await topic.save()
    }
  })

  // TODO: redirect to success page
  ctx.redirect('/')
})

app.use(router.routes())
app.use(router.allowedMethods())

const PORT = 3000
app.listen(PORT)
console.log(`Listening on port: ${PORT}`)

// Every Friday at 8AM
// schedule.scheduleJob('0 8 * * 5', function () {
// TODO
// })
