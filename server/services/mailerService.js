const nodemailer = require("nodemailer");

// Same fail-soft posture as config/redis.js: SMTP is real infrastructure a dev environment
// often doesn't have configured, so a missing config degrades to "log the link to the
// console" instead of blocking the password-reset feature entirely. Unlike Redis though,
// there's no silent no-op path here — reset links always end up somewhere the person running
// the server can see them, whether that's their inbox or their terminal.
let transporter = null;

const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// Called from authController.forgotPassword. Never throws — a delivery failure shouldn't
// turn into a 500 that reveals anything about whether the email was even valid (see the
// controller's generic response either way), so failures are logged and swallowed here.
const sendPasswordResetEmail = async (email, resetLink) => {
  if (!smtpConfigured()) {
    console.log(
      `[mailer] SMTP not configured — password reset link for ${email}:\n  ${resetLink}`
    );
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Reset your Verve AI password",
      text: `Reset your password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
      html: `<p>Reset your password by clicking the link below. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, ignore this email.</p>`,
    });
  } catch (err) {
    console.error(`[mailer] Failed to send password reset email to ${email}:`, err.message);
  }
};

module.exports = { sendPasswordResetEmail };
