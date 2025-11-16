export async function sendVerificationEmail(to: string, verifyUrl: string) {
  // Prefer Resend SDK if configured
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'no-reply@example.com';

  const subject = 'Verify your College Marketplace email';
  const html = `<p>Click the link below to verify your College Marketplace email:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>This link expires in 24 hours.</p>`;

  if (resendKey) {
    try {
      // Use Resend SDK for reliable sending (matches your example)
      // dynamic import so devs without the package don't crash on import
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Resend } = require('resend');
      const resend = new Resend(resendKey);
      const result = await resend.emails.send({ from, to, subject, html });
      // Log identifiable info so devs can confirm delivery in server logs
      // The Resend SDK typically returns an object with an `id` or similar
      // which can be inspected in the Resend dashboard.
      // eslint-disable-next-line no-console
      console.info('Resend SDK: email sent', { to, id: result?.id ?? null });
      return;
    } catch (err) {
      console.warn('Resend SDK send failed, falling back to HTTP or SMTP', err);
      // fall through to next fallback
    }
  }

  // Fallback HTTP attempt to Resend public endpoint (in case SDK not available)
  if (resendKey) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '<no body>');
        console.warn('Resend HTTP returned non-ok', resp.status, text);
      } else {
        console.info('Resend HTTP: email queued', { to, status: resp.status });
        return;
      }
    } catch (err) {
      console.warn('Resend HTTP send failed:', err);
    }
  }

  // Fallback: attempt SMTP via nodemailer if SMTP env vars are set
  try {
    // dynamic import to avoid requiring nodemailer unless needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({ from, to, subject, html });
    console.info('SMTP: email sent', { to, messageId: info?.messageId ?? null });
    return;
  } catch (err) {
    console.error('Failed to send verification email via any provider', err);
    throw err;
  }
}
