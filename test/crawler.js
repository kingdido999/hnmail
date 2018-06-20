const HackerNewsCrawler = require('../HackerNewsCrawler')
;(async () => {
  const topics = ['AI', 'blockchain', 'startup', 'education', 'interview']

  try {
    const results = await HackerNewsCrawler.fetchArticlesByTopics(topics)
    console.log(results)
  } catch (err) {
    console.log(err)
  }
})()
