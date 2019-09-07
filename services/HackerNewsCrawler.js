const puppeteer = require('puppeteer')
const { isLocal } = require('../.env')

const BASE_URL =
  'https://hn.algolia.com/?sort=byPopularity&prefix&page=0&dateRange=pastWeek&type=story'
const inputSelector = 'input[type="search"]'
const resultsSelector = '.Story_data'

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
            const link = div.querySelector('.Story_title > a')
            const [points, author, date, comments, originalLink] = div
              .querySelector('.Story_meta')
              .querySelectorAll('span:not(.Story_separator) > a')

            const domainMatch = link.href.match(/:\/\/(.[^/]+)/)

            return {
              title: link.textContent,
              link: originalLink ? originalLink.href : link.href,
              authorLink: author.href,
              hnLink: points.href,
              domain: domainMatch && domainMatch.length > 0
                ? domainMatch[1]
                : '',
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
