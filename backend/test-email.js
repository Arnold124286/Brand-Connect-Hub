require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'barazaarnold45@gmail.com',
  subject: 'Diagnostic Test',
  text: 'Hello test'
}).then(info => {
  console.log('✅ Sent successfully:', info.messageId);
  process.exit(0);
}).catch(e => {
  console.error('❌ Failed to send:', e.message);
  process.exit(1);
});
