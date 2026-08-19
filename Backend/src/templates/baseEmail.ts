/**
 * Shared shell for transactional email.
 *
 * Email clients strip <style> blocks and ignore flexbox/grid, so layout is
 * table-based with inline styles throughout. Widths are fixed rather than
 * fluid because Outlook ignores max-width on table cells.
 */

export interface BaseEmailOptions {
  /** Short line shown in the inbox preview, after the subject. */
  preheader: string;
  /** Absolute https URL — remote images are the only kind clients reliably render. */
  logoUrl: string;
  churchName: string;
  /** Main content, already wrapped in <p>/<table> markup. */
  bodyHtml: string;
  footerHtml: string;
}

const NAVY = '#0a1f44';
const ACCENT = '#415e94';
const INK = '#334155';
const MUTED = '#94a3b8';
const PAGE_BG = '#f7f9fc';

export function renderBaseEmail(options: BaseEmailOptions): string {
  const { preheader, logoUrl, churchName, bodyHtml, footerHtml } = options;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(churchName)}</title>
</head>
<body style="margin:0; padding:0; background-color:${PAGE_BG}; -webkit-font-smoothing:antialiased;">

<!-- Inbox preview text, hidden in the body itself -->
<div style="display:none; font-size:1px; color:${PAGE_BG}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
  ${escapeHtml(preheader)}
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.08);">

        <!-- Masthead -->
        <tr>
          <td align="center" style="background-color:${NAVY}; padding:36px 32px 30px 32px;">
            <img src="${escapeHtml(logoUrl)}" width="64" height="64" alt="${escapeHtml(churchName)}"
                 style="display:block; width:64px; height:64px; border:0; outline:none; text-decoration:none;" />
            <div style="margin-top:16px; font-family:Georgia,'Times New Roman',serif; font-size:22px; line-height:28px; color:#ffffff; font-weight:bold;">
              ${escapeHtml(churchName)}
            </div>
            <div style="margin-top:6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; line-height:16px; color:#7687b2; letter-spacing:1.5px; text-transform:uppercase;">
              Raising leaders that transform society
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px 32px 32px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:${INK};">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f8fafc; border-top:1px solid #eef2f7; padding:22px 32px; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:19px; color:${MUTED}; text-align:center;">
            ${footerHtml}
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

/** Primary call-to-action. Uses a table so Outlook renders the full button area. */
export function renderButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr>
    <td align="center" bgcolor="${NAVY}" style="border-radius:10px;">
      <a href="${escapeHtml(href)}"
         style="display:inline-block; padding:14px 32px; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:10px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

export const emailPalette = { NAVY, ACCENT, INK, MUTED, PAGE_BG };

/** User-supplied values land in markup, so escape them. */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
