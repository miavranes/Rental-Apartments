const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"Rentura" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verification code',
    html: `
      <h2>Welcome!</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 4px;">${code}</h1>
      <p>The code will expire in 10 minutes.</p>
    `,
  });
};

module.exports = sendVerificationEmail;