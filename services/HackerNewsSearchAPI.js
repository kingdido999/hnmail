const axios = require('axios')

class HackerNewsSearchAPI {
  constructor() {
    this.axios = axios.create({
      baseURL: 'https://hn.algolia.com/api/v1/'
    })
  }

  search (params) {
    return this.axios.get('/search', { params }) 
  }
}

module.exports = HackerNewsSearchAPI
