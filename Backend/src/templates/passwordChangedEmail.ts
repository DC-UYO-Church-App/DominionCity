import { config } from '../config';
import { renderBaseEmail, renderButton, escapeHtml, emailPalette } from './baseEmail';
import type { RenderedEmail } from './welcomeEmail';

export interface PasswordChangedEmailOptions {
  firstName: string;
  /** When the change happened, for the reader to recognise or dispute. */
  changedAt: Date;
}

/**
 * Sent after a password is actually changed. This is the safety net on the
 * reset flow: if someone else triggered it, this is how the account holder
 * finds out while they can still do something about it.
 */
export function renderPasswordChangedEmail({
  firstName,
  changedAt,
}: PasswordChangedEmailOptions): RenderedEmail {
  const appUrl = config.cors.origin.replace(/\/$/, '');
  const logoUrl = `${appUrl}/logo.png`;
  const loginUrl = `${appUrl}/login`;
  const churchName = config.church.name;
  const name = escapeHtml(firstName);

  const when = changedAt.toLocaleString('en-NG', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  });

  const bodyHtml = `
            <h1 style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:31px; color:${emailPalette.NAVY}; font-weight:bold;">
              Your password was changed
            </h1>

            <p style="margin:0 0 16px 0;">
              Hi ${name}, the password on your ${escapeHtml(churchName)} account was
              changed on <strong>${escapeHtml(when)}</strong>.
            </p>

            <p style="margin:0 0 4px 0;">
              If this was you, nothing further is needed &mdash; sign in with your new password.
            </p>

            ${renderButton(loginUrl, 'Sign in')}

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0 0; background-color:#fef2f2; border-radius:10px;">
              <tr>
                <td style="padding:16px 18px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:21px; color:#7f1d1d;">
                  <strong>Wasn&#39;t you?</strong><br />
                  Contact us immediately at
                  <a href="mailto:${escapeHtml(config.church.email)}" style="color:#b91c1c; font-weight:bold;">${escapeHtml(config.church.email)}</a>
                  so we can secure your account.
                </td>
              </tr>
            </table>`;

  const footerHtml = `
            <div style="margin-bottom:6px; color:#64748b; font-weight:bold;">${escapeHtml(churchName)}</div>
            <div>${escapeHtml(config.church.address)}</div>
            <div style="margin-top:10px;">This is a security notification and cannot be turned off.</div>`;

  const html = renderBaseEmail({
    preheader: `Your ${churchName} password was changed on ${when}.`,
    logoUrl,
    churchName,
    bodyHtml,
    footerHtml,
  });

  const text = [
    `Hi ${firstName},`,
    '',
    `The password on your ${churchName} account was changed on ${when}.`,
    '',
    `If this was you, nothing further is needed — sign in at ${loginUrl}`,
    '',
    `Wasn't you? Contact us immediately at ${config.church.email} so we can secure`,
    'your account.',
    '',
    '--',
    churchName,
    config.church.address,
    'This is a security notification and cannot be turned off.',
  ].join('\n');

  return {
    subject: `Your ${churchName} password was changed`,
    html,
    text,
  };
}
