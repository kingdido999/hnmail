const HackerNewsSearchAPI = require('./HackerNewsSearchAPI')

const getDateTimestampSinceDays = (sinceDays) => {
  return Math.trunc(new Date().setDate(new Date().getDate() - sinceDays) / 1000)
}

class HackerNewsCrawler {
  static async fetchArticlesByTopics(topics, limit = 7) {
    console.log('Fetching: %o', topics)

    const api = new HackerNewsSearchAPI()
    const sinceDays = getDateTimestampSinceDays(7)
    const numericFilters = `created_at_i>${sinceDays}`
    const tags = 'story'
    let results = {}

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]
      const { data } = await api.search({ query: topic, numericFilters, tags })
      const articles = data.hits
        .filter(
          (item, index, items) =>
            index === items.findIndex((t) => t.title === item.title)
        )
        .map((hit) => {
          return {
            ...hit,
            hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
          }
        })
        .slice(0, limit)

      results[topic] = articles
    }

    return results
  }
}

module.exports = HackerNewsCrawler
