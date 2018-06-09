const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const views = require('koa-views')
const app = new Koa()

// setup views, appending .ejs
// when no extname is given to render()

app.use(views(path.join(__dirname, '/views'), { extension: 'ejs' }))

const router = new Router()

router.get('/', async ctx => {
  await ctx.render('index')
})

app.use(router.routes())
app.use(router.allowedMethods())

const PORT = 3000
app.listen(PORT)
console.log(`Listening on port: ${PORT}`)
