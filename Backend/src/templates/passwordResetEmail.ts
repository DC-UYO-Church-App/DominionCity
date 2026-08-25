import { config } from '../config';
import { renderBaseEmail, renderButton, escapeHtml, emailPalette } from './baseEmail';
import type { RenderedEmail } from './welcomeEmail';

export interface PasswordResetEmailOptions {
  firstName: string;
  /** Absolute link containing the one-time token. */
  resetUrl: string;
  /** How long the link stays valid, in minutes. */
  expiresInMinutes: number;
}

export function renderPasswordResetEmail({
  firstName,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailOptions): RenderedEmail {
  const appUrl = config.cors.origin.replace(/\/$/, '');
  const logoUrl = `${appUrl}/logo.png`;
  const churchName = config.church.name;
  const name = escapeHtml(firstName);

  const bodyHtml = `
            <h1 style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:31px; color:${emailPalette.NAVY}; font-weight:bold;">
              Reset your password
            </h1>

            <p style="margin:0 0 16px 0;">
              Hi ${name}, we received a request to reset the password on your
              ${escapeHtml(churchName)} account.
            </p>

            <p style="margin:0 0 4px 0;">
              Choose a new password using the button below. This link expires in
              <strong>${expiresInMinutes} minutes</strong> and can only be used once.
            </p>

            ${renderButton(resetUrl, 'Choose a new password')}

            <p style="margin:0 0 16px 0; font-size:14px; color:#64748b;">
              If the button does not work, copy this link into your browser:<br />
              <span style="word-break:break-all; color:${emailPalette.ACCENT};">${escapeHtml(resetUrl)}</span>
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0 0; background-color:#f8fafc; border-radius:10px;">
              <tr>
                <td style="padding:16px 18px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:21px; color:#64748b;">
                  <strong style="color:${emailPalette.NAVY};">Didn&#39;t ask for this?</strong><br />
                  You can safely ignore this email &mdash; your password will not change
                  until someone opens the link above and sets a new one.
                </td>
              </tr>
            </table>`;

  const footerHtml = `
            <div style="margin-bottom:6px; color:#64748b; font-weight:bold;">${escapeHtml(churchName)}</div>
            <div>${escapeHtml(config.church.address)}</div>
            <div style="margin-top:10px;">You are receiving this because a password reset was requested for this email address.</div>`;

  const html = renderBaseEmail({
    preheader: `Reset your ${churchName} password — this link expires in ${expiresInMinutes} minutes.`,
    logoUrl,
    churchName,
    bodyHtml,
    footerHtml,
  });

  const text = [
    `Hi ${firstName},`,
    '',
    `We received a request to reset the password on your ${churchName} account.`,
    '',
    `Choose a new password here (expires in ${expiresInMinutes} minutes, single use):`,
    resetUrl,
    '',
    "Didn't ask for this? You can safely ignore this email — your password will not",
    'change until someone opens the link above and sets a new one.',
    '',
    '--',
    churchName,
    config.church.address,
    'You are receiving this because a password reset was requested for this email address.',
  ].join('\n');

  return {
    subject: `Reset your ${churchName} password`,
    html,
    text,
  };
}
