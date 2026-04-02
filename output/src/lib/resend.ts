import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export async function sendMagicLinkEmail(params: {
  to: string
  token: string
  fundName: string
  fromEmail: string
  appUrl: string
}): Promise<void> {
  const { to, token, fundName, fromEmail, appUrl } = params
  const verifyUrl = `${appUrl}/auth/verify?token=${token}`

  const resend = getResendClient()

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Sign in to ${fundName}`,
    html: buildMagicLinkHtml({ fundName, verifyUrl }),
  })
}

export async function sendInviteEmail(params: {
  to: string
  lpName: string
  fundName: string
  fromEmail: string
  appUrl: string
}): Promise<void> {
  const { to, lpName, fundName, fromEmail, appUrl } = params
  const loginUrl = `${appUrl}/login`

  const resend = getResendClient()

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `You've been invited to ${fundName}`,
    html: buildInviteHtml({ lpName, fundName, loginUrl }),
  })
}

function buildMagicLinkHtml(params: { fundName: string; verifyUrl: string }): string {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="color: #18181b; font-weight: 600; font-size: 20px; margin-bottom: 16px;">${params.fundName}</h2>
      <p style="color: #52525b; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
        Click the link below to sign in to your investor portal. This link expires in 15 minutes.
      </p>
      <a href="${params.verifyUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500;">
        Sign in to portal
      </a>
      <p style="color: #a1a1aa; font-size: 13px; margin-top: 24px;">
        If you did not request this link, you can safely ignore this email.
      </p>
    </div>
  `
}

function buildInviteHtml(params: { lpName: string; fundName: string; loginUrl: string }): string {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="color: #18181b; font-weight: 600; font-size: 20px; margin-bottom: 16px;">${params.fundName}</h2>
      <p style="color: #52525b; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
        Hello ${params.lpName}, you have been granted access to the ${params.fundName} investor portal.
        Use the link below and enter your email to sign in.
      </p>
      <a href="${params.loginUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500;">
        Go to portal
      </a>
      <p style="color: #a1a1aa; font-size: 13px; margin-top: 24px;">
        If you were not expecting this email, you can safely ignore it.
      </p>
    </div>
  `
}
