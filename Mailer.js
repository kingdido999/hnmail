const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = require('./.env')

class Mailer {
  constructor (html) {
    this.html = html
  }

  async send () {
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
      from: 'info@hnmail.io', // sender address
      to: 'kingdido999@gmail.com', // list of receivers
      subject: 'HN Mail', // Subject line
      html: this.html
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
