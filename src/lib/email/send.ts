import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import { getVerificationEmailHTML, getVerificationEmailText } from "./templates";
import type { EmailLocale } from "./templates";

/**
 * Create nodemailer transporter with SMTP configuration
 */
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true";

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP configuration is incomplete. Please check environment variables.");
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

interface SendVerificationEmailParams {
  to: string;
  verificationCode: string;
  loginUrl?: string;
  locale?: EmailLocale;
}

/**
 * Send verification code email
 */
export async function sendVerificationEmail({
  to,
  verificationCode,
  loginUrl,
  locale = "zh",
}: SendVerificationEmailParams): Promise<void> {
  const emailFrom = process.env.EMAIL_FROM || "noreply@example.com";
  const siteName = process.env.SITE_NAME || "TDP";
  const expiryMinutes = parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES || "10", 10);

  const subject =
    locale === "zh" ? `${siteName} 登录验证码` : `${siteName} Login Verification Code`;

  const html = getVerificationEmailHTML({
    verificationCode,
    expiryMinutes,
    siteName,
    loginUrl,
    locale,
  });

  const text = getVerificationEmailText({
    verificationCode,
    expiryMinutes,
    siteName,
    loginUrl,
    locale,
  });

  const mailOptions: SendMailOptions = {
    from: emailFrom,
    to,
    subject,
    html,
    text,
  };

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${to}, messageId: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${to}:`, error);
    throw new Error("Failed to send verification email. Please check SMTP configuration.");
  }
}
