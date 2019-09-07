const HackerNewsCrawler = require('../services/HackerNewsCrawler')
;(async () => {
  const topics = ['rust', 'blockchain', 'show hn', 'ask hn']

  try {
    const results = await HackerNewsCrawler.fetchArticlesByTopics(topics)
    console.log(results)
  } catch (err) {
    console.log(err)
  }
})()
