"""
Email Service — sends verification codes via Gmail SMTP.

Uses Python's built-in smtplib — no extra dependencies.

Setup:
  1. Enable 2-Step Verification on your Google account.
  2. Go to https://myaccount.google.com/apppasswords
  3. Create an App Password for "Mail".
  4. Set SMTP_USER and SMTP_PASSWORD in Backend/.env

If SMTP credentials are not configured, codes are printed to the
server console so development still works without a real email account.
"""

import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_verification_email(to_email: str, full_name: str, code: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{code} is your InsureAI verification code"
    msg["From"]    = settings.EMAIL_FROM
    msg["To"]      = to_email

    plain = f"""Hi {full_name},

Your InsureAI verification code is:

  {code}

This code expires in 15 minutes.

If you did not create an InsureAI account, please ignore this email.

— InsureAI Team
"""

    html = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#f4f6f9; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff; border-radius:12px; overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#2563eb; padding:28px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700;">
                InsureAI
              </h1>
              <p style="margin:4px 0 0; color:#bfdbfe; font-size:13px;">
                Smart insurance. Simpler claims.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px; color:#374151; font-size:15px;">
                Hi <strong>{full_name}</strong>,
              </p>
              <p style="margin:0 0 24px; color:#374151; font-size:15px;">
                Use the code below to verify your InsureAI account.
                This code expires in <strong>15 minutes</strong>.
              </p>

              <!-- Code box -->
              <div style="text-align:center; margin:0 0 28px;">
                <span style="display:inline-block; background:#eff6ff;
                             border:2px solid #bfdbfe; border-radius:10px;
                             padding:18px 36px; font-size:36px; font-weight:800;
                             color:#1d4ed8; letter-spacing:10px;">
                  {code}
                </span>
              </div>

              <p style="margin:0; color:#6b7280; font-size:13px;">
                If you did not create an InsureAI account, you can safely ignore
                this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:16px 32px;
                       border-top:1px solid #e5e7eb;">
              <p style="margin:0; color:#9ca3af; font-size:12px; text-align:center;">
                © 2026 InsureAI. This is an automated message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html,  "html"))
    return msg


def send_verification_email(to_email: str, full_name: str, code: str) -> None:
    """
    Send the 6-digit verification code to the user's email.

    If SMTP credentials are not configured in .env, the code is logged
    to the console instead so development keeps working.
    """
    if not settings.email_configured:
        # Development fallback — print to server console
        logger.warning(
            "EMAIL NOT CONFIGURED — verification code for %s: %s  "
            "(Set SMTP_USER and SMTP_PASSWORD in .env to send real emails)",
            to_email,
            code,
        )
        return

    msg = _build_verification_email(to_email, full_name, code)

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info("Verification email sent to %s", to_email)
    except smtplib.SMTPAuthenticationError:
        logger.error(
            "SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD in .env. "
            "Make sure you are using a Gmail App Password, not your account password."
        )
        # Don't raise — code is still saved in DB so user can retry
    except Exception as exc:
        logger.error("Failed to send verification email to %s: %s", to_email, exc)
