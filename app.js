const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const views = require('koa-views')
const koaBody = require('koa-body')
const app = new Koa()

// setup views, appending .ej
// when no extname is given to render()

app.use(views(path.join(__dirname, '/views'), { extension: 'ejs' }))
app.use(koaBody())

const router = new Router()

router.get('/', async ctx => {
  await ctx.render('pages/index')
})

router.post('/subscribe', async ctx => {
  const { email, topics } = ctx.request.body
  ctx.redirect('/')
})

app.use(router.routes())
app.use(router.allowedMethods())

const PORT = 3000
app.listen(PORT)
console.log(`Listening on port: ${PORT}`)
