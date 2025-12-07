import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import { getVerificationEmailHTML, getVerificationEmailText } from "./templates";
import type { EmailLocale } from "./templates";

interface SendVerificationEmailParams {
  to: string;
  verificationCode: string;
  loginUrl?: string;
  locale?: EmailLocale;
}

/**
 * Send email using Resend API (recommended, 100 free emails/day)
 */
async function sendWithResend(
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Resend API error:", errorData);
    throw new Error(`Resend API error: ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ Email sent via Resend to ${to}, id: ${result.id}`);
}

/**
 * Send email using SMTP (traditional method)
 */
async function sendWithSMTP(
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string
): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true";

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP configuration is incomplete");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions: SendMailOptions = { from, to, subject, html, text };
  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent via SMTP to ${to}, messageId: ${info.messageId}`);
}

/**
 * Send verification code email
 * Automatically chooses provider: Resend API (if configured) or SMTP
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

  // Try Resend first (recommended), then fall back to SMTP
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  try {
    if (hasResend) {
      await sendWithResend(to, subject, html, text, emailFrom);
    } else if (hasSMTP) {
      await sendWithSMTP(to, subject, html, text, emailFrom);
    } else {
      throw new Error(
        "Email not configured. Set RESEND_API_KEY (recommended) or SMTP_HOST/SMTP_USER/SMTP_PASS"
      );
    }
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw new Error("发送邮件失败，请稍后重试");
  }
}

