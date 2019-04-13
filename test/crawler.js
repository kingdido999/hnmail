const HackerNewsCrawler = require('../services/HackerNewsCrawler')
;(async () => {
  const topics = ['scraping']

  try {
    const results = await HackerNewsCrawler.fetchArticlesByTopics(topics)
    console.log(results)
  } catch (err) {
    console.log(err)
  }
})()
