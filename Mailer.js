const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const { mailgun } = require('./.env')

class Mailer {
  async send (receivers, context) {
    const transporter = nodemailer.createTransport(
      mg({
        auth: {
          api_key: mailgun.apiKey,
          domain: mailgun.domain
        }
      })
    )

    // setup email data with unicode symbols
    let mailOptions = {
      from: 'HN Mail <info@hnmail.io>', // sender address
      to: receivers, // list of receivers
      subject: 'Hacker News Weekly', // Subject line
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
