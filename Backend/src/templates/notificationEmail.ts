import { config } from '../config';
import { renderBaseEmail, renderButton, escapeHtml, emailPalette } from './baseEmail';
import type { RenderedEmail } from './welcomeEmail';

export interface NotificationEmailOptions {
  firstName: string;
  title: string;
  message: string;
  /** Optional call to action, e.g. the cell group page for a join response. */
  action?: { label: string; path: string };
}

/**
 * The shell every in-app notification goes out in.
 *
 * Notifications previously shipped their own inline markup, so they arrived
 * unbranded and inconsistent with the welcome and password mail. Routing them
 * through the shared base keeps one look across everything the church sends.
 */
export function renderNotificationEmail({
  firstName,
  title,
  message,
  action,
}: NotificationEmailOptions): RenderedEmail {
  const appUrl = config.cors.origin.replace(/\/$/, '');
  const logoUrl = `${appUrl}/logo.png`;
  const churchName = config.church.name;

  const actionUrl = action ? `${appUrl}${action.path}` : `${appUrl}/dashboard`;
  const actionLabel = action?.label ?? 'Open your dashboard';

  const bodyHtml = `
            <h1 style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:31px; color:${emailPalette.NAVY}; font-weight:bold;">
              ${escapeHtml(title)}
            </h1>

            <p style="margin:0 0 16px 0;">Hi ${escapeHtml(firstName)},</p>

            <p style="margin:0 0 4px 0;">${escapeHtml(message)}</p>

            ${renderButton(actionUrl, actionLabel)}

            <p style="margin:0; font-size:14px; color:#64748b;">
              Questions? Reply to this email or reach us at
              <a href="mailto:${escapeHtml(config.church.email)}" style="color:${emailPalette.ACCENT}; text-decoration:none; font-weight:bold;">${escapeHtml(config.church.email)}</a>.
            </p>`;

  const footerHtml = `
            <div style="margin-bottom:6px; color:#64748b; font-weight:bold;">${escapeHtml(churchName)}</div>
            <div>${escapeHtml(config.church.address)}</div>
            <div style="margin-top:10px;">You are receiving this because you have an account with ${escapeHtml(churchName)}.</div>`;

  const html = renderBaseEmail({
    preheader: message.slice(0, 140),
    logoUrl,
    churchName,
    bodyHtml,
    footerHtml,
  });

  const text = [
    `Hi ${firstName},`,
    '',
    title,
    '',
    message,
    '',
    `${actionLabel}: ${actionUrl}`,
    '',
    `Questions? Reply to this email or reach us at ${config.church.email}.`,
    '',
    '--',
    churchName,
    config.church.address,
  ].join('\n');

  return { subject: title, html, text };
}
