import { config } from '../config';
import { renderBaseEmail, renderButton, escapeHtml, emailPalette } from './baseEmail';

export interface WelcomeEmailOptions {
  firstName: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderWelcomeEmail({ firstName }: WelcomeEmailOptions): RenderedEmail {
  // CORS_ORIGIN is the public site, which is where the logo and sign-in page live.
  const appUrl = config.cors.origin.replace(/\/$/, '');
  const logoUrl = `${appUrl}/logo.png`;
  const loginUrl = `${appUrl}/login`;
  const churchName = config.church.name;
  const name = escapeHtml(firstName);

  const bodyHtml = `
            <h1 style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:31px; color:${emailPalette.NAVY}; font-weight:bold;">
              Welcome, ${name}!
            </h1>

            <p style="margin:0 0 16px 0;">
              Your account has been created, and we are glad you have joined ${escapeHtml(churchName)}.
            </p>

            <p style="margin:0 0 4px 0;">
              Sign in to explore what is happening in the house:
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 4px 0;">
              <tr><td style="padding:5px 0;">&#9679;&nbsp; Sermons and teaching archives</td></tr>
              <tr><td style="padding:5px 0;">&#9679;&nbsp; Upcoming events and programs</td></tr>
              <tr><td style="padding:5px 0;">&#9679;&nbsp; Your cell group and attendance</td></tr>
              <tr><td style="padding:5px 0;">&#9679;&nbsp; Giving, tithes and pledges</td></tr>
            </table>

            ${renderButton(loginUrl, 'Sign in to your account')}

            <p style="margin:0; font-size:14px; color:#64748b;">
              Need a hand? Reply to this email or reach us at
              <a href="mailto:${escapeHtml(config.church.email)}" style="color:${emailPalette.ACCENT}; text-decoration:none; font-weight:bold;">${escapeHtml(config.church.email)}</a>.
            </p>`;

  const footerHtml = `
            <div style="margin-bottom:6px; color:#64748b; font-weight:bold;">${escapeHtml(churchName)}</div>
            <div>${escapeHtml(config.church.address)}</div>
            <div style="margin-top:10px;">You are receiving this because an account was created with this email address.</div>`;

  const html = renderBaseEmail({
    preheader: `Your ${churchName} account is ready — sign in to get started.`,
    logoUrl,
    churchName,
    bodyHtml,
    footerHtml,
  });

  // Plain-text alternative, so the message is legible where HTML is blocked and
  // so spam filters see a real multipart body rather than tag-stripped markup.
  const text = [
    `Welcome, ${firstName}!`,
    '',
    `Your account has been created, and we are glad you have joined ${churchName}.`,
    '',
    'Sign in to explore sermons, upcoming events and programs, your cell group and',
    'attendance, and giving.',
    '',
    `Sign in: ${loginUrl}`,
    '',
    `Need a hand? Reply to this email or reach us at ${config.church.email}.`,
    '',
    '--',
    churchName,
    config.church.address,
    'You are receiving this because an account was created with this email address.',
  ].join('\n');

  return {
    subject: `Welcome to ${churchName}`,
    html,
    text,
  };
}
