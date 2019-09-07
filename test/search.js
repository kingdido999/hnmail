const HackerNewsSearchAPI = require('../services/HackerNewsSearchAPI')

const getDateTimestampSinceDays = (sinceDays) => {
  return Math.trunc(new Date().setDate(new Date().getDate() - sinceDays) / 1000)
};

;(async () => {
  const query = 'rust'
  const api = new HackerNewsSearchAPI()
  const sinceDays = getDateTimestampSinceDays(7)
  const numericFilters = `created_at_i>${sinceDays}`
  const tags = 'story'

  try {
    const { data } = await api.search({ query, numericFilters, tags })
    console.log(data.hits.length)
  } catch (err) {
    console.log(err)
  }
})()
