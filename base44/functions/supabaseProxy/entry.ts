import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { action, table, params, data, id } = body;

    // Get settings from app_settings entity
    const settings = await base44.asServiceRole.entities.app_settings.list();
    const supabaseUrl = settings.find(s => s.key === 'supabase_url')?.value;
    const supabaseKey = settings.find(s => s.key === 'supabase_service_role_key')?.value;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase not configured. Please set URL and key in Settings.' }, { status: 400 });
    }

    const baseUrl = `${supabaseUrl}/rest/v1/${table}`;
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': action === 'insert' ? 'return=representation' : 'return=representation',
    };

    let url = baseUrl;
    let method = 'GET';
    let fetchBody = undefined;

    if (action === 'list') {
      const queryParts = [];
      if (params?.select) queryParts.push(`select=${encodeURIComponent(params.select)}`);
      else queryParts.push('select=*');
      if (params?.filters) {
        for (const [key, val] of Object.entries(params.filters)) {
          queryParts.push(`${key}=${encodeURIComponent(val)}`);
        }
      }
      if (params?.order) queryParts.push(`order=${encodeURIComponent(params.order)}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.offset) queryParts.push(`offset=${params.offset}`);
      if (queryParts.length) url += '?' + queryParts.join('&');
    } else if (action === 'get') {
      url += `?id=eq.${id}&select=*`;
    } else if (action === 'update') {
      // mgh_contacts uses supabaseid as PK
      const pkField = params?.pk_field || 'id';
      url += `?${pkField}=eq.${id}`;
      method = 'PATCH';
      fetchBody = JSON.stringify(data);
    } else if (action === 'insert') {
      method = 'POST';
      fetchBody = JSON.stringify(data);
    } else if (action === 'delete') {
      url += `?id=eq.${id}`;
      method = 'DELETE';
    } else if (action === 'test_connection') {
      url += '?select=id&limit=1';
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const response = await fetch(url, {
      method,
      headers,
      body: fetchBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText, status: response.status }, { status: response.status });
    }

    const result = await response.json();
    return Response.json({ data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});