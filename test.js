const HackerNewsCrawler = require('./HackerNewsCrawler')
const Mailer = require('./Mailer')
;(async () => {
  const hnCrawler = new HackerNewsCrawler()
  const topics = ['javascript', 'interview']

  try {
    const results = await hnCrawler.fetchArticlesByTopics(topics)
    const html = results.reduce((acc, result) => {
      const { keyword, articles } = result

      const articlesHtml = articles.reduce((acc, article) => {
        const { title, link, domain } = article
        return `${acc}<p><a href=${link}>${title}</a><small> (${domain}) </small></p>`
      }, '')

      return `${acc}<h2>${keyword}</h2>${articlesHtml}`
    }, '')

    const mailer = new Mailer()
    await mailer.send(['kingdido999@gmail.com'], html)
  } catch (err) {
    console.log(err)
  }
})()
