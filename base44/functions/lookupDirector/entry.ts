import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Use service role to list all users regardless of caller's permissions
    const users = await base44.asServiceRole.entities.User.list();
    const match = users.find(u =>
      u.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
      u.role === 'mgh_director'
    );

    if (!match) {
      return Response.json({ found: false });
    }

    return Response.json({ found: true, full_name: match.full_name, email: match.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});