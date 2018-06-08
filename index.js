const puppeteer = require('puppeteer')

const BASE_URL =
  'https://hn.algolia.com/?sort=byPopularity&prefix&page=0&dateRange=pastWeek&type=story'
const query = 'javascript'
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  })
  const page = await browser.newPage()

  const url = `${BASE_URL}&query=${query}`
  await page.goto(url, { waitUntil: 'networkidle2' })

  const resultsSelector = '.item-title-and-infos'
  await page.waitForSelector(resultsSelector)
  const results = await page.evaluate(resultsSelector => {
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
          points: Number(points)
        }
      })
      .filter(({ points }) => points > 0)
  }, resultsSelector)

  console.log(results)

  await browser.close()
})()
