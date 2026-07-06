const sgMail = require('@sendgrid/mail');

// ─── SendGrid Initialization ──────────────────────────────────────────────────
const hasSendGridConfig = !!process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@brandconnecthub.com';

if (hasSendGridConfig) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✉️  SendGrid Web API configured (HTTPS — no SMTP port needed)');
} else {
  console.log('⚠️  No SENDGRID_API_KEY found. Email service will run in DEV MODE (logging to console).');
}

// ─── Base send function ──────────────────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  if (!hasSendGridConfig) {
    console.log('⚠️  DEV MODE — SendGrid not configured. Logging email instead:');
    console.log('--------------------------------------------------');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${html}`);
    console.log('--------------------------------------------------');
    return { success: true, dev: true };
  }

  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: 'Brand Connect Hub',
      },
      subject,
      html,
    };

    const [response] = await sgMail.send(msg);
    console.log(`✅ Email sent to ${to} | Status: ${response.statusCode}`);
    return { success: true, statusCode: response.statusCode };
  } catch (err) {
    const message = err.response
      ? JSON.stringify(err.response.body)
      : err.message;
    console.error('❌ Email sending failed:', message);
    throw new Error(message);
  }
};

// ─── OTP Verification Email ──────────────────────────────────────────────────
const sendOTPEmail = async (email, otp) => {
  const subject = 'Verify your Brand Connect Hub account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e1e1e1; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0;">Brand Connect Hub</h1>
        <p style="color: #6b7280; margin-top: 4px;">Account Verification</p>
      </div>

      <h2 style="color: #111827;">Welcome! 👋</h2>
      <p style="color: #374151;">Please use the following One-Time Password (OTP) to verify your account:</p>

      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center;
                  padding: 24px; background: #f3f4f6; border-radius: 10px; margin: 24px 0;
                  color: #111827; border: 2px dashed #d1d5db;">
        ${otp}
      </div>

      <p style="color: #374151;">⏱ This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #374151;">If you didn't create an account, you can safely ignore this email.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Brand Connect Hub · All rights reserved
      </p>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// ─── Welcome Email ───────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, fullName) => {
  const subject = 'Welcome to Brand Connect Hub!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e1e1e1; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0;">Brand Connect Hub</h1>
      </div>

      <h2 style="color: #111827;">Hi ${fullName}! 🎉</h2>
      <p style="color: #374151;">Your account has been verified successfully. You're all set to get started on Brand Connect Hub.</p>
      <p style="color: #374151;">Connect with top brands and vendors, manage projects, and grow your business.</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL}/dashboard"
           style="background: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px;
                  text-decoration: none; font-weight: bold; font-size: 16px;">
          Go to Dashboard →
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Brand Connect Hub · All rights reserved
      </p>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// ─── Password Reset Email ────────────────────────────────────────────────────
const sendPasswordResetEmail = async (email, otp) => {
  const subject = 'Reset your Brand Connect Hub password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e1e1e1; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0;">Brand Connect Hub</h1>
        <p style="color: #6b7280; margin-top: 4px;">Password Reset</p>
      </div>

      <h2 style="color: #111827;">Reset Your Password 🔐</h2>
      <p style="color: #374151;">Use the OTP below to reset your password:</p>

      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center;
                  padding: 24px; background: #fef3c7; border-radius: 10px; margin: 24px 0;
                  color: #111827; border: 2px dashed #f59e0b;">
        ${otp}
      </div>

      <p style="color: #374151;">⏱ This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #ef4444;"><strong>If you didn't request a password reset, please secure your account immediately.</strong></p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Brand Connect Hub · All rights reserved
      </p>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// ─── Project Notification Email ──────────────────────────────────────────────
const sendProjectNotificationEmail = async (email, fullName, projectTitle, message) => {
  const subject = `Project Update: ${projectTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e1e1e1; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0;">Brand Connect Hub</h1>
        <p style="color: #6b7280; margin-top: 4px;">Project Notification</p>
      </div>

      <h2 style="color: #111827;">Hi ${fullName},</h2>
      <p style="color: #374151;">${message}</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL}/dashboard"
           style="background: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px;
                  text-decoration: none; font-weight: bold; font-size: 16px;">
          View Project →
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Brand Connect Hub · All rights reserved
      </p>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendProjectNotificationEmail,
};