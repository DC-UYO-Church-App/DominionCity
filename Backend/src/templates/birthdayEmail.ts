import { config } from '../config';
import { renderBaseEmail, renderButton, escapeHtml, emailPalette } from './baseEmail';
import type { RenderedEmail } from './welcomeEmail';

export interface BirthdayEmailOptions {
  firstName: string;
  /** Age in years, when the birth year is known and plausible. Omitted otherwise. */
  age?: number;
}

const GOLD = '#b8860b';
const WARM_BG = '#fdf8ed';

/**
 * The birthday greeting. Deliberately its own template rather than the generic
 * notification shell: this is the one piece of mail the church sends purely to
 * make someone feel celebrated, and it should not look like an alert.
 */
export function renderBirthdayEmail({ firstName, age }: BirthdayEmailOptions): RenderedEmail {
  const appUrl = config.cors.origin.replace(/\/$/, '');
  const logoUrl = `${appUrl}/logo.png`;
  const churchName = config.church.name;
  const name = escapeHtml(firstName || 'friend');

  const ageLine = age
    ? `<p style="margin:0 0 16px 0;">What a gift these ${age} years have been, and what a joy it is to walk this new one with you.</p>`
    : '';

  const bodyHtml = `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${WARM_BG}; border-radius:12px; margin:0 0 22px 0;">
              <tr>
                <td align="center" style="padding:26px 20px;">
                  <div style="font-size:40px; line-height:44px;">&#127874;</div>
                  <div style="margin-top:10px; font-family:Georgia,'Times New Roman',serif; font-size:27px; line-height:34px; color:${GOLD}; font-weight:bold;">
                    Happy Birthday, ${name}!
                  </div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px 0;">
              Today the whole house celebrates you. We thank God for the day you were born and for
              everything you bring to this family.
            </p>

            ${ageLine}

            <p style="margin:0 0 16px 0;">
              Our prayer is that this new year of your life overflows with God's goodness: peace in
              your home, favour in your work, health in your body, and joy that no season can take
              from you.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="margin:0 0 22px 0; border-left:4px solid ${GOLD}; background-color:${WARM_BG}; border-radius:0 8px 8px 0;">
              <tr>
                <td style="padding:16px 18px; font-family:Georgia,'Times New Roman',serif; font-style:italic; font-size:15px; line-height:24px; color:${emailPalette.INK};">
                  "The LORD bless you and keep you; the LORD make his face shine on you and be
                  gracious to you; the LORD turn his face toward you and give you peace."
                  <div style="margin-top:8px; font-style:normal; font-size:13px; color:${emailPalette.MUTED};">
                    Numbers 6:24-26
                  </div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px 0;">
              Enjoy your day, ${name}. We are celebrating with you and we cannot wait to see you.
            </p>

            ${renderButton(appUrl, `Celebrate with us at ${escapeHtml(churchName)}`)}

            <p style="margin:0; font-size:14px; color:#64748b;">
              With love, your family at ${escapeHtml(churchName)}.
            </p>`;

  const footerHtml = `
            <div style="margin-bottom:6px; color:#64748b; font-weight:bold;">${escapeHtml(churchName)}</div>
            <div>${escapeHtml(config.church.address)}</div>
            <div style="margin-top:10px;">You are receiving this because today is your birthday and you are part of our family.</div>`;

  const html = renderBaseEmail({
    preheader: `${firstName || 'Friend'}, the whole house is celebrating you today.`,
    logoUrl,
    churchName,
    bodyHtml,
    footerHtml,
  });

  const text = [
    `Happy Birthday, ${firstName || 'friend'}!`,
    '',
    'Today the whole house celebrates you. We thank God for the day you were born and',
    'for everything you bring to this family.',
    ...(age ? ['', `What a gift these ${age} years have been, and what a joy it is to walk this new one with you.`] : []),
    '',
    "Our prayer is that this new year of your life overflows with God's goodness: peace",
    'in your home, favour in your work, health in your body, and joy that no season can',
    'take from you.',
    '',
    '"The LORD bless you and keep you; the LORD make his face shine on you and be',
    'gracious to you; the LORD turn his face toward you and give you peace."',
    '  - Numbers 6:24-26',
    '',
    `Enjoy your day, ${firstName || 'friend'}. We are celebrating with you and we cannot wait to see you.`,
    '',
    `With love, your family at ${churchName}.`,
    '',
    '--',
    churchName,
    config.church.address,
    'You are receiving this because today is your birthday and you are part of our family.',
  ].join('\n');

  return {
    subject: `Happy Birthday, ${firstName || 'friend'}! 🎉`,
    html,
    text,
  };
}
