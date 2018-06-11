const nodemailer = require('nodemailer')

class Mailer {
  constructor (html) {
    this.html = html
  }

  async send () {
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
      html: this.html
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
}

module.exports = Mailer
