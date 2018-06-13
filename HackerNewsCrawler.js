const puppeteer = require('puppeteer')

const BASE_URL =
  'https://hn.algolia.com/?sort=byPopularity&prefix&page=0&dateRange=pastWeek&type=story'

class HackerNewsCrawler {
  async fetchArticlesByTopics (topics) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    let results = []

    for (let i = 0; i < topics.length; i++) {
      const query = topics[i]
      const inputSelector = 'input[type="search"]'
      await page.type(inputSelector, query)
      await page.waitFor(1000)
      const resultsSelector = '.item-title-and-infos'
      await page.waitForSelector(resultsSelector)

      const articles = await page.evaluate(resultsSelector => {
        const divs = Array.from(document.querySelectorAll(resultsSelector))
        return divs
          .map(div => {
            const link = div.querySelector('a')
            const points = div
              .querySelector('ul')
              .querySelector('span')
              .textContent.split(' ')[0]
            return {
              title: link.text,
              link: link.href,
              domain: link.href.match(/:\/\/(.[^/]+)/)[1],
              points: Number(points)
            }
          })
          .filter(
            (item, index, items) =>
              index === items.findIndex(t => t.title === item.title)
          )
          .filter(({ points }) => points > 0)
          .slice(10)
      }, resultsSelector)

      await page.focus(inputSelector)

      for (let j = 0; j < query.length; j++) {
        await page.keyboard.press('Backspace')
      }

      results.push({
        keyword: query,
        articles
      })
    }

    await browser.close()

    return results
  }

  formatToHTML (results) {
    const html = results.reduce((acc, result) => {
      const { keyword, articles } = result

      const articlesHtml = articles.reduce((acc, article) => {
        const { title, link, domain } = article
        return `${acc}<p><a href=${link}>${title}</a><small> (${domain}) </small></p>`
      }, '')

      return `${acc}<h2>${keyword}</h2>${articlesHtml}`
    }, '')

    return html
  }
}

module.exports = HackerNewsCrawler
