import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { to, contactname, code } = await req.json();

    if (!to || !code) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const name = contactname || 'Propriétaire';

    const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#ffffff;">
  <div style="background:#8B1A1A;padding:24px 32px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">Moroccan Guest Houses</p>
    <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Propulsé par Hospitality Web Services</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:15px;">Bonjour <strong>${name}</strong>,</p>
    <p style="color:#666;font-size:14px;line-height:1.6;">Voici votre code de connexion à l'Espace Propriétaire MGH :</p>
    <div style="text-align:center;margin:24px 0;padding:20px;background:#f9f0f0;border:2px solid #8B1A1A;border-radius:8px;">
      <p style="margin:0 0 4px 0;color:#8B1A1A;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Votre code</p>
      <p style="margin:0;color:#8B1A1A;font-size:40px;font-weight:bold;letter-spacing:10px;">${code}</p>
    </div>
    <p style="color:#999;font-size:12px;text-align:center;">⏱ Valide pendant <strong>10 minutes</strong>.</p>
    <p style="color:#999;font-size:12px;text-align:center;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
  </div>
  <div style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
    <p style="margin:0;color:#aaa;font-size:11px;">Hospitality Web Services — MGH Dashboard</p>
  </div>
</div>`;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Moroccan Guest Houses <${Deno.env.get('RESEND_FROM_EMAIL') || 'mgh@hospitalitywebservices.com'}>`,
        to: [to],
        subject: `Votre code de connexion MGH — ${code}`,
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