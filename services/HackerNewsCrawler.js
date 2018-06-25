const puppeteer = require('puppeteer')
const { isLocal } = require('../.env')

const BASE_URL =
  'https://hn.algolia.com/?sort=byPopularity&prefix&page=0&dateRange=pastWeek&type=all'
const inputSelector = 'input[type="search"]'
const resultsSelector = '.item-title-and-infos'

class HackerNewsCrawler {
  static async fetchArticlesByTopics (topics) {
    console.log('Fetching articles...')
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
      const topic = topics[i]
      console.log('Searching topic: %s', topic)
      await page.type(inputSelector, topic)
      await page.waitFor(1000)

      try {
        await page.waitForSelector(resultsSelector, { timeout: 3000 })
      } catch (err) {
        // If no result is available, skip this topic
        await clearSearch(page, topic)
        results[topic] = []
        continue
      }

      const articles = await page.evaluate(resultsSelector => {
        const divs = Array.from(document.querySelectorAll(resultsSelector))
        return divs
          .map(div => {
            const link = div.querySelector('h2').lastElementChild
            const itemInfos = div.querySelector('ul').querySelectorAll('span')
            const [points, author, date, comments] = itemInfos
            debugger
            return {
              title: link.textContent,
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
          .slice(0, 7)
      }, resultsSelector)

      results[topic] = articles
      await clearSearch(page, topic)
      await page.waitFor(1000)
    }

    await browser.close()
    console.log('Fetching done.')

    return results
  }
}

async function clearSearch (page, query) {
  await page.focus(inputSelector)

  for (let j = 0; j < query.length; j++) {
    await page.keyboard.press('Backspace')
  }
}

module.exports = HackerNewsCrawler
