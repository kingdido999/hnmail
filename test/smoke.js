const HackerNewsCrawler = require('../HackerNewsCrawler')
const Mailer = require('../Mailer')
;(async () => {
  const hnCrawler = new HackerNewsCrawler()
  const topics = ['javascript', 'interview']

  try {
    const results = await hnCrawler.fetchArticlesByTopics(topics)

    const mailer = new Mailer()
    await mailer.send(['kingdido999@gmail.com'], { topics: results })
  } catch (err) {
    console.log(err)
  }
})()
