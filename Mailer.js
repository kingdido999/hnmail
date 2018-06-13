const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = require('./.env')

class Mailer {
  async send (receivers, html) {
    const transporter = nodemailer.createTransport(
      mg({
        auth: {
          api_key: MAILGUN_API_KEY,
          domain: MAILGUN_DOMAIN
        }
      })
    )

    // setup email data with unicode symbols
    let mailOptions = {
      from: 'HN Mail <info@hnmail.io>', // sender address
      to: receivers, // list of receivers
      subject: 'Hacker News Weekly', // Subject line
      html: html
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
