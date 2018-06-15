const HackerNewsCrawler = require('../HackerNewsCrawler')
const Mailer = require('../Mailer')
;(async () => {
  const hnCrawler = new HackerNewsCrawler()
  const topics = ['javascript', 'interview']

  try {
    const results = await hnCrawler.fetchArticlesByTopics(topics)
    const html = hnCrawler.formatToHTML(results)

    const mailer = new Mailer()
    await mailer.send(['kingdido999@gmail.com'], html)
  } catch (err) {
    console.log(err)
  }
})()
