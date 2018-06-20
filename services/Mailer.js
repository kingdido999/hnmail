const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const { mailgun } = require('../.env')
const R = require('ramda')

const transporter = nodemailer.createTransport(
  mg({
    auth: {
      api_key: mailgun.apiKey,
      domain: mailgun.domain
    }
  })
)

class Mailer {
  static async send (mailOptions) {
    const mergedOptions = R.merge(
      {
        from: 'HN Mail <info@hnmail.io>'
      },
      mailOptions
    )

    try {
      console.log('Sending email to: %s', mailOptions.to)
      const info = await transporter.sendMail(mergedOptions)
      console.log('Message sent: %s', info.messageId)
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = Mailer
