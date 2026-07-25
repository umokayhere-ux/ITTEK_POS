import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env.js';
import { logger } from './logger.js';

let transporter: Transporter | null = null;

export const isMailConfigured = (): boolean => Boolean(env.SMTP_HOST && env.SMTP_USER);

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends an email if SMTP is configured; otherwise logs and no-ops so flows that
 * "send" email still succeed in environments without a mail provider.
 */
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    logger.warn({ to, subject }, 'SMTP not configured — email skipped');
    return false;
  }
  await t.sendMail({ from: env.SMTP_FROM, to, subject, html });
  return true;
}

/** Base URL used to build links in emails. */
export function appBaseUrl(): string {
  return env.APP_URL || env.CORS_ORIGINS[0] || 'http://localhost:4000';
}
