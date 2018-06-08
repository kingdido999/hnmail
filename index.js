const puppeteer = require('puppeteer')
const nodemailer = require('nodemailer')
;(async () => {
  const includes = ['javascript', 'python']
  try {
    const results = await fetchArticles(includes)
    const html = results.reduce((acc, result) => {
      const { keyword, articles } = result

      const articlesHtml = articles.reduce((acc, article) => {
        const { title, link, domain } = article
        return `${acc}<p><a href=${link}>${title}</a><small> (${domain}) </small></p>`
      }, '')

      return `${acc}<h2>${keyword}</h2>${articlesHtml}`
    }, '')

    await sendEmail(html)
  } catch (err) {
    console.log(err)
  }
})()

async function fetchArticles (includes) {
  const BASE_URL =
    'https://hn.algolia.com/?sort=byPopularity&prefix&page=0&dateRange=pastWeek&type=story'

  const browser = await puppeteer.launch(
    {
      // headless: false,
      // devtools: true
    }
  )
  const page = await browser.newPage()

  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

  let results = []

  for (let i = 0; i < includes.length; i++) {
    const include = includes[i]
    const inputSelector = 'input[type="search"]'
    await page.type(inputSelector, include)
    await page.waitFor(2000)
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
        .filter(({ points }) => points > 0)
    }, resultsSelector)

    await page.focus(inputSelector)

    for (let j = 0; j < include.length; j++) {
      await page.keyboard.press('Backspace')
    }

    results.push({
      keyword: include,
      articles
    })
  }

  await browser.close()

  return results
}

async function sendEmail (html) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'xofali3enenzicve@ethereal.email',
      pass: 'WNHJggkuA3QWSqPESq'
    }
  })

  // setup email data with unicode symbols
  let mailOptions = {
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: 'bar@example.com, baz@example.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    html
  }

  try {
    // send mail with defined transport object
    const info = await transporter.sendMail(mailOptions)

    console.log('Message sent: %s', info.messageId)
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  } catch (err) {
    console.log(err)
  }
}
