import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, contactname, portalUrl } = await req.json();

    if (!to) {
      return Response.json({ error: 'Missing email address' }, { status: 400 });
    }

    const name = contactname || 'Propriétaire';
    const url = portalUrl || 'https://mgh-dashboard.base44.app/portal';

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'mgh@hospitalitywebservices.com';

    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#ffffff;">
  <div style="background:#8B1A1A;padding:24px 32px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">Moroccan Guest Houses</p>
    <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Propulsé par Hospitality Web Services</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:15px;">Bonjour <strong>${name}</strong>,</p>
    <p style="color:#666;font-size:14px;line-height:1.6;">
      Vous êtes invité(e) à rejoindre la plateforme <strong>Moroccan Guest Houses</strong>.<br/>
      Vous pouvez dès à présent accéder à votre espace propriétaire pour consulter et gérer les détails de votre riad.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}" style="background:#8B1A1A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;display:inline-block;">
        Accéder à mon espace
      </a>
    </div>
    <p style="color:#999;font-size:12px;text-align:center;">
      Connectez-vous avec l'adresse email à laquelle vous avez reçu ce message.<br/>
      Un code de vérification vous sera envoyé à chaque connexion.
    </p>
    <p style="color:#999;font-size:12px;text-align:center;">Si vous n'êtes pas concerné(e), ignorez cet email.</p>
  </div>
  <div style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
    <p style="margin:0;color:#aaa;font-size:11px;">Hospitality Web Services — MGH Dashboard</p>
  </div>
</div>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Moroccan Guest Houses <${FROM_EMAIL}>`,
        to: [to],
        subject: `Invitation à la plateforme Moroccan Guest Houses`,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: result }, { status: response.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});