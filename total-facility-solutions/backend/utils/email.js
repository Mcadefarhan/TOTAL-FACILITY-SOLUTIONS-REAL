const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 5,
    rateLimit: 10,
  });
};

// ─── Base Email Template ──────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Total Facility Solutions</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Georgia, sans-serif; background: #F0EDE8; color: #1a1a2e; }
  .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 40px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0F2647 0%, #1A3A6B 100%); padding: 32px 40px; text-align: center; }
  .logo { font-size: 22px; font-weight: 700; color: #E5B44D; letter-spacing: -0.5px; }
  .logo span { color: rgba(255,255,255,0.6); font-weight: 300; }
  .body { padding: 40px; }
  .greeting { font-size: 24px; font-weight: 600; color: #0F2647; margin-bottom: 12px; }
  .text { font-size: 15px; line-height: 1.7; color: #4a5568; margin-bottom: 16px; }
  .otp-box { background: #F7F3ED; border: 2px dashed #C8922A; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0; }
  .otp-label { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .otp-code { font-size: 42px; font-weight: 700; color: #0F2647; letter-spacing: 12px; font-family: 'Courier New', monospace; }
  .otp-expiry { font-size: 13px; color: #888; margin-top: 10px; }
  .btn { display: inline-block; background: #C8922A; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
  .divider { height: 1px; background: #eee; margin: 24px 0; }
  .warning { background: #FFF8E6; border-left: 3px solid #C8922A; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #8B6914; margin-top: 16px; }
  .footer { background: #F7F7F7; padding: 24px 40px; text-align: center; }
  .footer-text { font-size: 12px; color: #999; line-height: 1.6; }
  .footer-brand { font-size: 13px; font-weight: 600; color: #0F2647; margin-bottom: 4px; }
  .badge { display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 4px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Total Facility <span>Solutions</span></div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <div class="footer-brand">Total Facility Solutions</div>
    <p class="footer-text">
      Connecting skilled workers with businesses across India.<br>
      This is an automated email. Please do not reply directly.<br>
      © ${new Date().getFullYear()} Total Facility Solutions. All rights reserved.
    </p>
  </div>
</div>
</body>
</html>`;

// ─── Email Templates ──────────────────────────────────────────────
const templates = {
  otpVerification: (name, otp) => baseTemplate(`
    <p class="greeting">Hello, ${name}! 👋</p>
    <p class="text">Welcome to <strong>Total Facility Solutions</strong>. Please verify your email address to complete your registration.</p>
    <div class="otp-box">
      <div class="otp-label">Your Verification Code</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏱️ This code expires in <strong>10 minutes</strong></div>
    </div>
    <p class="text">Enter this code on the verification page to activate your account.</p>
    <div class="warning">⚠️ Never share this OTP with anyone. Our team will never ask for this code.</div>
  `),

  otpResend: (name, otp) => baseTemplate(`
    <p class="greeting">New Verification Code</p>
    <p class="text">Hi ${name}, you requested a new verification code. Here it is:</p>
    <div class="otp-box">
      <div class="otp-label">New Verification Code</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏱️ Expires in <strong>10 minutes</strong></div>
    </div>
    <div class="warning">⚠️ Your previous OTP has been invalidated. Use only this new code.</div>
  `),

  passwordReset: (name, resetLink) => baseTemplate(`
    <p class="greeting">Password Reset Request</p>
    <p class="text">Hi ${name}, we received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetLink}" class="btn">Reset My Password</a>
    </div>
    <p class="text" style="font-size: 13px; color: #888;">This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>
    <div class="warning">⚠️ For security, this link can only be used once. If you need another reset, please submit a new request.</div>
  `),

  welcomeSeeker: (name) => baseTemplate(`
    <p class="greeting">Welcome aboard, ${name}! 🎉</p>
    <p class="text">Your account has been verified and you're now part of <strong>Total Facility Solutions</strong>. We're excited to help you find the right opportunity!</p>
    <div class="divider"></div>
    <p class="text"><strong>What's next?</strong></p>
    <p class="text">✅ Complete your profile with your skills and experience<br>
    ✅ Submit your job application form<br>
    ✅ Our team will match you with suitable employers</p>
    <div class="divider"></div>
    <p class="text" style="font-size: 13px; color: #888;">Your profile will be reviewed by our admin team within 24 hours of submission.</p>
  `),

  welcomeEmployer: (name, businessName) => baseTemplate(`
    <p class="greeting">Welcome, ${name}! 🏢</p>
    <p class="text">Your employer account for <strong>${businessName || 'your business'}</strong> has been verified. You can now submit staff requirements and find the right candidates through our platform.</p>
    <div class="divider"></div>
    <p class="text"><strong>What you can do:</strong></p>
    <p class="text">✅ Submit staff requests with detailed requirements<br>
    ✅ Browse matched candidates<br>
    ✅ Contact admin for personalized assistance<br>
    ✅ Track all your requests in real-time</p>
  `),

  applicationUpdate: (name, status, adminNote) => baseTemplate(`
    <p class="greeting">Application Status Update</p>
    <p class="text">Hi ${name}, here's an update on your job application:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span class="badge">${status.toUpperCase()}</span>
    </div>
    ${adminNote ? `<p class="text"><strong>Note from Admin:</strong> ${adminNote}</p>` : ''}
    <p class="text">Log in to your dashboard to view the full details and any next steps.</p>
  `),

  staffRequestUpdate: (name, requestTitle, status) => baseTemplate(`
    <p class="greeting">Staff Request Update</p>
    <p class="text">Hi ${name}, your staff request "<strong>${requestTitle}</strong>" has been updated:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span class="badge">${status.toUpperCase()}</span>
    </div>
    <p class="text">Log in to your employer dashboard to view matched candidates and next steps.</p>
  `),

  newMatchNotification: (employerName, requestTitle, seekerName) => baseTemplate(`
    <p class="greeting">New Candidate Match! 🎯</p>
    <p class="text">Hi ${employerName}, our admin has matched a candidate for your request "<strong>${requestTitle}</strong>".</p>
    <p class="text"><strong>Matched Candidate:</strong> ${seekerName}</p>
    <p class="text">Log in to your dashboard to review the candidate's profile and take action.</p>
  `),
};

// ─── Send Email ───────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Total Facility Solutions" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

// ─── Exported Email Senders ───────────────────────────────────────
const emailService = {
  sendOTP: async (email, name, otp) => sendEmail({
    to: email,
    subject: `${otp} - Verify your Total Facility Solutions account`,
    html: templates.otpVerification(name, otp),
  }),

  resendOTP: async (email, name, otp) => sendEmail({
    to: email,
    subject: `${otp} - New verification code for Total Facility Solutions`,
    html: templates.otpResend(name, otp),
  }),

  sendPasswordReset: async (email, name, resetLink) => sendEmail({
    to: email,
    subject: 'Reset your Total Facility Solutions password',
    html: templates.passwordReset(name, resetLink),
  }),

  sendWelcomeSeeker: async (email, name) => sendEmail({
    to: email,
    subject: '🎉 Welcome to Total Facility Solutions!',
    html: templates.welcomeSeeker(name),
  }),

  sendWelcomeEmployer: async (email, name, businessName) => sendEmail({
    to: email,
    subject: '🏢 Welcome to Total Facility Solutions - Employer Account',
    html: templates.welcomeEmployer(name, businessName),
  }),

  sendApplicationUpdate: async (email, name, status, adminNote) => sendEmail({
    to: email,
    subject: `Application Status Update: ${status}`,
    html: templates.applicationUpdate(name, status, adminNote),
  }),

  sendStaffRequestUpdate: async (email, name, requestTitle, status) => sendEmail({
    to: email,
    subject: `Staff Request Update: ${status}`,
    html: templates.staffRequestUpdate(name, requestTitle, status),
  }),

  sendMatchNotification: async (email, employerName, requestTitle, seekerName) => sendEmail({
    to: email,
    subject: '🎯 New Candidate Matched for Your Request',
    html: templates.newMatchNotification(employerName, requestTitle, seekerName),
  }),
};

module.exports = emailService;
