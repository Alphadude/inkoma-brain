/**
 * Modern, responsive email templates for Inkoma
 * Designed in Inkoma's signature Gold & White theme.
 */

interface BaseTemplateOptions {
  preheader: string;
  badgeText: string;
  headline: string;
  greeting?: string;
  bodyText: string;
  otp: string;
  expiryMinutes?: number;
  securityNote?: string;
}

/**
 * Renders an email in Inkoma's signature gold and white theme.
 * Table-based HTML structure for cross-client compatibility (Gmail, Apple Mail, Outlook).
 */
function renderEmailLayout(options: BaseTemplateOptions): string {
  const {
    preheader,
    badgeText,
    headline,
    greeting = 'Hello,',
    bodyText,
    otp,
    expiryMinutes = 10,
    securityNote,
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headline} — Inkoma</title>
  <style>
    /* Reset & Client-Specific Styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #FAF9F5; }
    
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .email-card { padding: 24px 18px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FAF9F5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;" class="email-container">
          
          <!-- Top Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Brand Wordmark with Gold Accent -->
                    <div style="font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #1C1917; text-transform: uppercase;">
                      I<span style="color: #C5A059;">N</span>KOMA
                    </div>
                    <div style="font-size: 10px; font-weight: 600; letter-spacing: 2.5px; color: #9E7D3B; text-transform: uppercase; margin-top: 4px;">
                      Oral Literature &amp; Folklore Sanctuary
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Elevated White Card -->
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EFE6D5; box-shadow: 0 4px 20px rgba(197, 160, 89, 0.08); overflow: hidden;" class="email-card">
              
              <!-- Gold Gradient Accent Ribbon -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #DFC062 0%, #C5A059 50%, #9E7D3B 100%); line-height: 4px; font-size: 4px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card Content Area -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 36px 32px 32px 32px;">
                
                <!-- Category Badge -->
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #FDF8ED; color: #9E7D3B; border: 1px solid #F3E5C8; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>

                <!-- Main Headline -->
                <tr>
                  <td style="padding-top: 16px; padding-bottom: 12px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1C1917; line-height: 1.3;">
                      ${headline}
                    </h1>
                  </td>
                </tr>

                <!-- Greeting & Body Text -->
                <tr>
                  <td style="color: #44403C; font-size: 15px; line-height: 1.6; padding-bottom: 24px;">
                    <p style="margin: 0 0 12px 0; font-weight: 600; color: #1C1917;">${greeting}</p>
                    <p style="margin: 0;">${bodyText}</p>
                  </td>
                </tr>

                <!-- OTP Code Display Card -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FDFBF7; border: 1.5px dashed #DCC89E; border-radius: 12px; padding: 22px 16px; text-align: center;">
                      <tr>
                        <td align="center">
                          <div style="font-size: 11px; font-weight: 600; color: #78716C; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">
                            One-Time Verification Code
                          </div>
                          <div class="otp-code" style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1C1917; padding: 6px 0;">
                            ${otp}
                          </div>
                          <div style="display: inline-block; margin-top: 8px; background-color: #FFFDF9; border: 1px solid #EADBBE; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #9E7D3B;">
                            Expires in ${expiryMinutes} minutes
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Security / Assistance Note -->
                <tr>
                  <td style="background-color: #FAF8F5; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #78716C; line-height: 1.5;">
                    ${
                      securityNote ||
                      'Never share this code with anyone. Inkoma storykeepers will never ask for your verification code or password.'
                    }
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td align="center" style="padding-top: 28px; padding-bottom: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #A8A29E; line-height: 1.5;">
                Sent with devotion to African oral heritage from <strong>Inkoma</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #A8A29E;">
                Need assistance? Contact our Griot Council at 
                <a href="mailto:inkomastories@gmail.com" style="color: #C5A059; text-decoration: none; font-weight: 600;">inkomastories@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Registration Email Verification Template
 */
export function getRegistrationOtpEmail(otp: string, name?: string): { html: string; text: string } {
  const displayName = name ? name.trim() : 'Storyteller';
  
  const html = renderEmailLayout({
    preheader: `Your Inkoma verification code is ${otp}. Complete your registration to enter the Griot Sanctuary.`,
    badgeText: 'Account Verification',
    headline: 'Welcome to the Sanctuary',
    greeting: `Greetings, ${displayName},`,
    bodyText:
      'Thank you for joining Inkoma. Use the one-time code below to verify your email address and activate your personal library, interactive reading, and storytelling guild access.',
    otp,
    expiryMinutes: 10,
    securityNote:
      'This code will expire in 10 minutes. If you did not create an account on Inkoma, you can safely disregard this email.',
  });

  const text = `Greetings, ${displayName},\n\nWelcome to Inkoma! Please use the following code to verify your account:\n\nVERIFICATION CODE: ${otp}\n\nThis code will expire in 10 minutes.\n\nInkoma — Oral Literature & Folklore Sanctuary`;

  return { html, text };
}

/**
 * Resend Email Verification Template
 */
export function getResendOtpEmail(otp: string, name?: string): { html: string; text: string } {
  const displayName = name ? name.trim() : 'Storyteller';

  const html = renderEmailLayout({
    preheader: `Your new Inkoma verification code is ${otp}.`,
    badgeText: 'New Verification Code',
    headline: 'Your Fresh Verification Code',
    greeting: `Greetings, ${displayName},`,
    bodyText:
      'We received a request for a new email verification code. Please enter the one-time code below to verify your account and begin your journey.',
    otp,
    expiryMinutes: 10,
    securityNote:
      'This fresh code invalidates any previous codes and will expire in 10 minutes. Never share this code with anyone.',
  });

  const text = `Greetings, ${displayName},\n\nHere is your new Inkoma verification code:\n\nVERIFICATION CODE: ${otp}\n\nThis code expires in 10 minutes.\n\nInkoma — Oral Literature & Folklore Sanctuary`;

  return { html, text };
}

/**
 * Password Reset OTP Template
 */
export function getPasswordResetOtpEmail(otp: string, name?: string): { html: string; text: string } {
  const displayName = name ? name.trim() : 'Storyteller';

  const html = renderEmailLayout({
    preheader: `Your Inkoma password reset code is ${otp}. Valid for 10 minutes.`,
    badgeText: 'Security Alert',
    headline: 'Password Reset Request',
    greeting: `Greetings, ${displayName},`,
    bodyText:
      'We received a request to reset the password for your Inkoma account. Use the one-time verification code below to authorize the password change:',
    otp,
    expiryMinutes: 10,
    securityNote:
      'If you did not request a password reset, your account is safe and no action is needed. You may safely ignore this message.',
  });

  const text = `Greetings, ${displayName},\n\nWe received a request to reset your Inkoma account password.\n\nRESET CODE: ${otp}\n\nThis code will expire in 10 minutes. If you did not make this request, you can safely ignore this email.\n\nInkoma — Oral Literature & Folklore Sanctuary`;

  return { html, text };
}
