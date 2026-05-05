import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code, contactname } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email requis' }, { status: 400 });
    }

    // Get Supabase credentials from app_settings
    const settings = await base44.asServiceRole.entities.app_settings.list();
    const supabaseUrl = settings.find(s => s.key === 'supabase_url')?.value;
    const supabaseKey = settings.find(s => s.key === 'supabase_service_role_key')?.value;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase non configuré' }, { status: 500 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'mgh@hospitalitywebservices.com';

    // If code provided → send OTP email
    if (code) {
      const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#ffffff;">
  <div style="background:#8B1A1A;padding:24px 32px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">Moroccan Guest Houses</p>
    <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Propulsé par Hospitality Web Services</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:15px;">Bonjour <strong>${contactname || 'Propriétaire'}</strong>,</p>
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

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Moroccan Guest Houses <${FROM_EMAIL}>`,
          to: [email],
          subject: `Votre code de connexion MGH — ${code}`,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err }, { status: res.status });
      }

      return Response.json({ success: true });
    }

    // Lookup ALL contacts by email in Supabase (multi-property support)
    const encodedEmail = encodeURIComponent(`eq.${email.toLowerCase().trim()}`);
    const url = `${supabaseUrl}/rest/v1/mgh_contacts?email=${encodedEmail}&select=supabaseid,contactname,email`;

    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: err }, { status: response.status });
    }

    const contacts = await response.json();
    if (!contacts || contacts.length === 0) {
      return Response.json({ found: false });
    }

    // Return all contacts for this email
    return Response.json({
      found: true,
      contacts: contacts.map(c => ({
        supabaseid: c.supabaseid,
        contactname: c.contactname || '',
        email: c.email,
      })),
      // Convenience: first contact name for greeting
      contactname: contacts[0].contactname || '',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});