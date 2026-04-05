const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('--------------------------------------------------');
    console.log(`Email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('--------------------------------------------------');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Brand Connect Hub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email sending failed:', err);
    console.log('--- EMERGENCY OTP LOG ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('-------------------------');
    // We don't re-throw so registration can proceed
  }
};

const sendOTPEmail = async (email, otp) => {
  const subject = 'Verify your Brand Connect Hub account';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
      <h2 style="color: #2563eb;">Welcome to Brand Connect Hub!</h2>
      <p>Please use the following One-Time Password (OTP) to verify your account:</p>
      <div style="font-size: 32px; font-bold; letter-spacing: 5px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">© 2024 Brand Connect Hub</p>
    </div>
  `;
  await sendEmail(email, subject, html);
};

module.exports = { sendEmail, sendOTPEmail };
