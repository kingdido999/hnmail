const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const { mailgun } = require('./.env')

class Mailer {
  async send (receivers, subject, context) {
    const transporter = nodemailer.createTransport(
      mg({
        auth: {
          api_key: mailgun.apiKey,
          domain: mailgun.domain
        }
      })
    )

    const mailOptions = {
      from: 'HN Mail <info@hnmail.io>',
      to: receivers,
      subject,
      template: {
        name: 'views/email/index.pug',
        engine: 'pug',
        context
      }
    }

    try {
      // send mail with defined transport object
      const info = await transporter.sendMail(mailOptions)
      console.log('Message sent: %s', info.messageId)
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = Mailer
