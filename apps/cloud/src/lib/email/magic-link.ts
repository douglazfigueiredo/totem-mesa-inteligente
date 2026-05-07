import { createTransport, type SendMailOptions } from 'nodemailer';

type Params = {
  identifier: string;
  url: string;
  provider: {
    server?: unknown;
    from?: string;
  };
};

export async function sendMagicLinkEmail(params: Params) {
  const { identifier, url, provider } = params;
  const { host } = new URL(url);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transport = createTransport(provider.server as any);
  const mail: SendMailOptions = {
    to: identifier,
    from: provider.from,
    subject: `Entrar no painel — ${host}`,
    text: textBody({ url, host }),
    html: htmlBody({ url, host }),
  };
  const result = await transport.sendMail(mail);

  const failed = (result.rejected ?? []).filter(Boolean);
  if (failed.length) {
    throw new Error(`E-mail de login não pôde ser enviado para: ${failed.join(', ')}`);
  }
}

function textBody({ url, host }: { url: string; host: string }) {
  return `Entrar em ${host}\n\nClique no link abaixo para acessar seu painel:\n${url}\n\nSe você não solicitou este e-mail, pode ignorá-lo com segurança.\n`;
}

function htmlBody({ url, host }: { url: string; host: string }) {
  const brandColor = '#111827';
  const buttonBg = '#111827';
  const buttonText = '#ffffff';
  const bodyBg = '#f5f1ea';
  const cardBg = '#ffffff';
  const ink = '#1a1a1a';
  const inkSoft = '#5b5b5b';

  return `
<body style="background:${bodyBg};margin:0;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;background:${cardBg};border-radius:16px;padding:32px;border:1px solid #e7e1d6;">
    <tr><td>
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${inkSoft};font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">totem mesa inteligente</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${brandColor};">Entrar no painel</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:${ink};">Clique no botão abaixo para acessar seu painel em <strong>${host}</strong>. O link é válido por 24 horas.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" style="border-radius:10px;background:${buttonBg};">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:${buttonText};text-decoration:none;border-radius:10px;">Entrar</a>
        </td>
      </tr></table>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${inkSoft};">Se você não pediu esse e-mail, pode ignorá-lo com segurança — ninguém vai conseguir acessar sua conta.</p>
    </td></tr>
  </table>
</body>
`;
}
