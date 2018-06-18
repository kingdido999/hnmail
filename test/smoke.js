const HackerNewsCrawler = require('../HackerNewsCrawler')
;(async () => {
  const hnCrawler = new HackerNewsCrawler()
  const topics = ['AI', 'blockchain', 'startup', 'education', 'interview']

  try {
    const results = await hnCrawler.fetchArticlesByTopics(topics)
    console.log(results)
  } catch (err) {
    console.log(err)
  }
})()
