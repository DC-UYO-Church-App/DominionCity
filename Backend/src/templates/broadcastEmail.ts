import { config } from '../config';
import { renderBaseEmail, escapeHtml, emailPalette } from './baseEmail';
import type { RenderedEmail } from './welcomeEmail';

export interface BroadcastEmailOptions {
  firstName: string;
  subject: string;
  /** Plain text written by an admin. Never HTML — it is escaped before use. */
  body: string;
}

/**
 * Wraps an admin-written message in the standard church shell.
 *
 * The body arrives as plain text from a textarea and is escaped, so an admin
 * cannot inject markup into a message that goes to the whole congregation.
 * Blank lines become paragraphs and single newlines become <br />, which is
 * what someone typing into a textarea expects to see.
 */
export function renderBroadcastEmail({ firstName, subject, body }: BroadcastEmailOptions): RenderedEmail {
  const appUrl = config.cors.origin.replace(/\/$/, '');
  const logoUrl = `${appUrl}/logo.png`;
  const churchName = config.church.name;
  const name = escapeHtml(firstName || 'friend');

  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px 0;">${escapeHtml(block).replace(/\n/g, '<br />')}</p>`
    )
    .join('\n            ');

  const bodyHtml = `
            <h1 style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:31px; color:${emailPalette.NAVY}; font-weight:bold;">
              Hello ${name},
            </h1>

            ${paragraphs}

            <p style="margin:0; font-size:14px; color:#64748b;">
              Questions? Reply to this email or reach us at
              <a href="mailto:${escapeHtml(config.church.email)}" style="color:${emailPalette.ACCENT}; text-decoration:none; font-weight:bold;">${escapeHtml(config.church.email)}</a>.
            </p>`;

  const footerHtml = `
            <div style="margin-bottom:6px; color:#64748b; font-weight:bold;">${escapeHtml(churchName)}</div>
            <div>${escapeHtml(config.church.address)}</div>
            <div style="margin-top:10px;">You are receiving this because you are a registered member of ${escapeHtml(churchName)}.</div>`;

  const html = renderBaseEmail({
    preheader: subject,
    logoUrl,
    churchName,
    bodyHtml,
    footerHtml,
  });

  const text = [
    `Hello ${firstName || 'friend'},`,
    '',
    body.trim(),
    '',
    `Questions? Reply to this email or reach us at ${config.church.email}.`,
    '',
    '--',
    churchName,
    config.church.address,
    `You are receiving this because you are a registered member of ${churchName}.`,
  ].join('\n');

  return { subject, html, text };
}
