const HackerNewsMailer = require("../src/services/HackerNewsMailer")
;(async () => {
  await HackerNewsMailer.sendNewsletters()
})()
