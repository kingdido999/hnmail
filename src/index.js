const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const serve = require('koa-static')
const views = require('koa-views')
const session = require('koa-session')
const koaBody = require('koa-body')
const mongoose = require('mongoose')
const schedule = require('node-schedule')
const HackerNewsMailer = require('./services/HackerNewsMailer')
const route = require('./route')

mongoose.connect('mongodb://localhost/hnmail', { useNewUrlParser: true })
const PORT = 3000

const app = new Koa()

app.keys = ['some secret hurr']
app.use(session(app))
app.use(serve('src/assets'))
app.use(views(path.join(__dirname, '/views'), { extension: 'pug' }))
app.use(koaBody())

const router = new Router()
route(router)
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT)
console.log(`Listening on port: ${PORT}`)

// Every Friday at 8AM
schedule.scheduleJob('0 15 * * 5', HackerNewsMailer.sendNewsletters)
