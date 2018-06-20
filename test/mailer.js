const HackerNewsMailer = require('../services/HackerNewsMailer')
;(async () => {
  await HackerNewsMailer.sendNewsletters()
})()
