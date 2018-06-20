const puppeteer = require('puppeteer')
const { isLocal } = require('../.env')

const BASE_URL =
  'https://hn.algolia.com/?sort=byPopularity&prefix&page=0&dateRange=pastWeek&type=story'

class HackerNewsCrawler {
  async fetchArticlesByTopics (topics) {
    let options = isLocal
      ? {
        headless: false,
        devtools: true
      }
      : {}

    const browser = await puppeteer.launch(options)
    const page = await browser.newPage()

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    let results = {}

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
            const itemInfos = div.querySelector('ul').querySelectorAll('span')
            const [points, author, date, comments] = itemInfos

            return {
              title: link.text,
              link: link.href,
              authorLink: div.querySelector('.author').parentNode.href,
              hnLink: div.querySelector('.comments').parentNode.href,
              domain: link.href.match(/:\/\/(.[^/]+)/)[1],
              points: Number(points.textContent.split(' ')[0]),
              author: author.textContent,
              date: date.textContent,
              comments: comments.textContent
            }
          })
          .sort((a, b) => b.points - a.points)
          .filter(
            (item, index, items) =>
              index === items.findIndex(t => t.title === item.title)
          )
          .filter(({ points }) => points > 0)
          .slice(0, 7)
      }, resultsSelector)

      await page.focus(inputSelector)

      for (let j = 0; j < query.length; j++) {
        await page.keyboard.press('Backspace')
      }

      results[query] = articles
    }

    await browser.close()

    return results
  }
}

module.exports = HackerNewsCrawler
