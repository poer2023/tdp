/**
 * Email templates for verification code login
 */

export type EmailLocale = "zh" | "en";

interface EmailTemplateParams {
  verificationCode: string;
  expiryMinutes: number;
  siteName: string;
  loginUrl?: string;
  locale?: EmailLocale;
}

/**
 * Generate HTML email template for verification code
 */
export function getVerificationEmailHTML({
  verificationCode,
  expiryMinutes,
  siteName,
  loginUrl,
  locale = "zh",
}: EmailTemplateParams): string {
  const translations = {
    zh: {
      title: "验证码登录",
      greeting: "您好！",
      intro: `您正在使用邮箱验证码登录 ${siteName}。`,
      codeLabel: "您的验证码是：",
      expiry: `此验证码将在 ${expiryMinutes} 分钟后过期，请尽快完成登录。`,
      securityTip: "如果这不是您本人的操作，请忽略此邮件。",
      alternativeLogin: "如果验证码输入失败，您也可以点击下方链接直接登录：",
      loginButton: "点击登录",
      footer: `此邮件由 ${siteName} 自动发送，请勿回复。`,
      supportLink: "如有问题，请联系客服",
    },
    en: {
      title: "Verification Code Login",
      greeting: "Hello!",
      intro: `You are logging in to ${siteName} with email verification code.`,
      codeLabel: "Your verification code is:",
      expiry: `This code will expire in ${expiryMinutes} minutes. Please complete your login soon.`,
      securityTip: "If you did not request this, please ignore this email.",
      alternativeLogin:
        "If the verification code doesn't work, you can also click the link below to log in directly:",
      loginButton: "Log In",
      footer: `This email is automatically sent by ${siteName}. Please do not reply.`,
      supportLink: "Contact support if you have any questions",
    },
  };

  const t = translations[locale];

  return `
<!DOCTYPE html>
<html lang="${locale === "zh" ? "zh-CN" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #111;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .code-box {
      background-color: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
      letter-spacing: 8px;
      font-family: 'Courier New', Courier, monospace;
    }
    .expiry {
      color: #6c757d;
      font-size: 14px;
      margin-top: 10px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #007bff;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
      font-weight: 600;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 14px;
      text-align: center;
    }
    .security-tip {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      color: #856404;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.intro}</p>

    <div class="code-box">
      <div style="color: #6c757d; font-size: 14px; margin-bottom: 10px;">${t.codeLabel}</div>
      <div class="code">${verificationCode}</div>
      <div class="expiry">${t.expiry}</div>
    </div>

    <div class="security-tip">
      ${t.securityTip}
    </div>

    ${
      loginUrl
        ? `
    <p>${t.alternativeLogin}</p>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">${t.loginButton}</a>
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>${t.footer}</p>
      <p><a href="mailto:support@example.com" style="color: #007bff; text-decoration: none;">${t.supportLink}</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email template for verification code
 */
export function getVerificationEmailText({
  verificationCode,
  expiryMinutes,
  siteName,
  loginUrl,
  locale = "zh",
}: EmailTemplateParams): string {
  const translations = {
    zh: {
      title: "验证码登录",
      greeting: "您好！",
      intro: `您正在使用邮箱验证码登录 ${siteName}。`,
      codeLabel: "您的验证码是：",
      expiry: `此验证码将在 ${expiryMinutes} 分钟后过期，请尽快完成登录。`,
      securityTip: "如果这不是您本人的操作，请忽略此邮件。",
      alternativeLogin: "如果验证码输入失败，您也可以复制下方链接到浏览器中直接登录：",
      footer: `此邮件由 ${siteName} 自动发送，请勿回复。`,
    },
    en: {
      title: "Verification Code Login",
      greeting: "Hello!",
      intro: `You are logging in to ${siteName} with email verification code.`,
      codeLabel: "Your verification code is:",
      expiry: `This code will expire in ${expiryMinutes} minutes. Please complete your login soon.`,
      securityTip: "If you did not request this, please ignore this email.",
      alternativeLogin:
        "If the verification code doesn't work, you can also copy the link below and paste it into your browser to log in directly:",
      footer: `This email is automatically sent by ${siteName}. Please do not reply.`,
    },
  };

  const t = translations[locale];

  return `
${t.title}
====================

${t.greeting}

${t.intro}

${t.codeLabel}
${verificationCode}

${t.expiry}

⚠️ ${t.securityTip}

${loginUrl ? `${t.alternativeLogin}\n${loginUrl}` : ""}

---
${t.footer}
  `.trim();
}
