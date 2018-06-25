const HackerNewsCrawler = require('../services/HackerNewsCrawler')
;(async () => {
  const topics = ['side hustle']

  try {
    const results = await HackerNewsCrawler.fetchArticlesByTopics(topics)
    console.log(results)
  } catch (err) {
    console.log(err)
  }
})()
