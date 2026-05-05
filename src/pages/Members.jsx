import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listContacts, listProperties, listCities, updateContact } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download, Mail } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_BADGE = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-orange-100 text-orange-700',
  pending: 'bg-blue-100 text-blue-700',
  'ex-member': 'bg-gray-100 text-gray-500',
};
const STATUS_LABEL = {
  active: 'Actif', suspended: 'Suspendu', pending: 'En attente', 'ex-member': 'Ex-membre',
};

function InlineEdit({ value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value || '');
  if (!editing) {
    return (
      <span
        className="cursor-pointer hover:underline text-gray-800 text-xs"
        onClick={() => { setV(value || ''); setEditing(true); }}
      >
        {value || <span className="text-gray-300 italic">—</span>}
      </span>
    );
  }
  return (
    <input
      autoFocus
      type={type}
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={() => { onSave(v); setEditing(false); }}
      onKeyDown={e => e.key === 'Enter' && (onSave(v), setEditing(false))}
      className="border border-blue-400 rounded px-1 py-0.5 text-xs w-full focus:outline-none"
    />
  );
}

function InlineSelect({ value, options, onSave }) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${STATUS_BADGE[value] || 'bg-gray-100 text-gray-500'}`}
        onClick={() => setEditing(true)}
      >
        {STATUS_LABEL[value] || value || '—'}
      </span>
    );
  }
  return (
    <select
      autoFocus
      value={value || ''}
      onChange={e => { onSave(e.target.value); setEditing(false); }}
      onBlur={() => setEditing(false)}
      className="border border-blue-400 rounded px-1 py-0.5 text-xs focus:outline-none"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function Members() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterNoEmail, setFilterNoEmail] = useState(false);
  const [emailModal, setEmailModal] = useState(null);
  const [newEmail, setNewEmail] = useState('');

  const { data: contactsResult, isLoading: loadingContacts } = useQuery({
    queryKey: ['members-contacts'],
    queryFn: () => listContacts({ limit: 500 }),
  });
  const { data: propsResult } = useQuery({
    queryKey: ['members-properties'],
    queryFn: () => listProperties({ limit: 500 }),
  });
  const { data: citiesResult } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
  });

  const contacts = contactsResult?.data || [];
  const rawProperties = propsResult?.data || [];
  const cities = citiesResult?.data || [];

  // Build a map from mgh_properties_final.id → property
  const propsMap = useMemo(() => {
    const m = {};
    rawProperties.forEach(p => {
      if (!p.id) return;
      let name = p.name;
      if (typeof name === 'string') { try { name = JSON.parse(name); } catch { name = {}; } }
      m[p.id] = { ...p, name };
    });
    return m;
  }, [rawProperties]);

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      // JOIN: mgh_contacts.supabaseid = mgh_properties_final.id
      const prop = propsMap[c.supabaseid] || {};
      const name = (c.contactname || c.riadname || '') + (prop.name?.fr || '');
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'all' && c.membershipstatus !== filterStatus) return false;
      const cityId = prop.city_id;
      if (filterCity !== 'all' && cityId !== filterCity) return false;
      // "Sans email" = missing access email (mgh_contacts.email)
      if (filterNoEmail && c.email) return false;
      return true;
    });
  }, [contacts, propsMap, search, filterStatus, filterCity, filterNoEmail]);

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-contacts'] });
      toast({ title: '✅ Sauvegardé' });
    },
  });

  // handleSave uses supabaseid as the row identifier
  const handleSave = (supabaseId, field, value) => {
    saveMutation.mutate({ id: supabaseId, data: { [field]: value } });
  };

  const handleEmailChange = () => {
    if (!newEmail || !emailModal) return;
    // Update mgh_contacts.email (access email — HWS managed)
    saveMutation.mutate({ id: emailModal.supabaseid, data: { email: newEmail } });
    setEmailModal(null);
  };

  const handleInvite = async (contact) => {
    const email = contact.email;
    if (!email) {
      toast({ title: '⚠ Pas d\'email', description: 'Ce contact n\'a pas d\'email d\'accès.', variant: 'destructive' });
      return;
    }
    try {
      await base44.functions.invoke('sendInvitationEmail', {
        to: email,
        contactname: contact.contactname || '',
      });
      toast({ title: '✅ Invitation envoyée', description: `Email envoyé à ${email}` });
    } catch (err) {
      toast({
        title: '❌ Échec envoi',
        description: err?.response?.data?.error ? JSON.stringify(err.response.data.error) : (err?.message || String(err)),
        variant: 'destructive',
      });
    }
  };

  const exportCSV = () => {
    const headers = ['supabaseid', 'riadname', 'contactname', 'email', 'Telephone', 'CM',
      'membershipstatus', 'Membersince', 'renewaldate', 'mghnotes', 'simplebookinglink'];
    const rows = contacts.map(c => headers.map(h => JSON.stringify(c[h] || '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mgh_contacts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d) => {
    try { return d ? format(new Date(d), 'dd/MM/yyyy') : '—'; } catch { return d || '—'; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membres MGH</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contacts.length} membres</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-sm" onClick={exportCSV}>
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="suspended">Suspendu</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="ex-member">Ex-membre</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Ville" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les villes</SelectItem>
            {cities.map(c => (
              <SelectItem key={c.id || c.name} value={c.id || c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => setFilterNoEmail(!filterNoEmail)}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            filterNoEmail ? 'text-white border-transparent' : 'text-gray-600 bg-white border-gray-300'
          }`}
          style={filterNoEmail ? { background: '#8B1A1A' } : {}}
        >
          Sans email accès
        </button>
        <span className="text-xs text-gray-400">{filtered.length} résultat(s)</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Riad</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Contact</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Email d'accès plateforme</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Téléphone</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Channel Manager</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Depuis</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Renouvellement</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Notes</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingContacts ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-3 py-3"><Skeleton className="h-3 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">Aucun membre trouvé</td>
                </tr>
              ) : (
                filtered.map(c => {
                  const prop = propsMap[c.supabaseid] || {};
                  const riadName = prop.name?.fr || c.riadname || '—';
                  return (
                    <tr key={c.supabaseid} className="border-b border-gray-100 hover:bg-gray-50 text-xs">
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[120px] truncate">{riadName}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[100px]">
                        {/* contactname — editable */}
                        <InlineEdit value={c.contactname} onSave={v => handleSave(c.supabaseid, 'contactname', v)} />
                      </td>
                      <td className="px-3 py-2 text-gray-500 max-w-[140px] truncate">
                        {/* mgh_contacts.email = access email — shown but edit via modal */}
                        {c.email || <span className="text-amber-500 font-medium">⚠ Vide</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {/* Telephone */}
                        <InlineEdit value={c.Telephone} onSave={v => handleSave(c.supabaseid, 'Telephone', v)} />
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {/* CM */}
                        <InlineEdit value={c.CM} onSave={v => handleSave(c.supabaseid, 'CM', v)} />
                      </td>
                      <td className="px-3 py-2">
                        <InlineSelect
                          value={c.membershipstatus}
                          options={[
                            { value: 'active', label: 'Actif' },
                            { value: 'suspended', label: 'Suspendu' },
                            { value: 'pending', label: 'En attente' },
                            { value: 'ex-member', label: 'Ex-membre' },
                          ]}
                          onSave={v => handleSave(c.supabaseid, 'membershipstatus', v)}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(c.Membersince)}</td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(c.renewaldate)}</td>
                      <td className="px-3 py-2 max-w-[120px]">
                        <InlineEdit value={c.mghnotes} onSave={v => handleSave(c.supabaseid, 'mghnotes', v)} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs whitespace-nowrap"
                            onClick={() => { setEmailModal(c); setNewEmail(c.email || ''); }}
                          >
                            <Mail className="w-3 h-3 mr-0.5" />Email
                          </Button>
                          <Button
                           size="sm"
                           variant="ghost"
                           className="h-6 px-2 text-xs text-blue-600"
                           onClick={() => handleInvite(c)}
                          >
                           Inviter
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email modal — change mgh_contacts.email (access email, HWS managed) */}
      {emailModal && (
        <Dialog open={!!emailModal} onOpenChange={() => setEmailModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'email d'accès plateforme</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-sm text-gray-600">
                Contact : <strong>{emailModal.contactname}</strong>
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                ⚠ Cet email est l'identifiant de connexion du propriétaire à la plateforme (mgh_contacts.email). 
                Il est géré exclusivement par HWS.
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nouvel email d'accès plateforme</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEmailModal(null)}>Annuler</Button>
                <Button
                  onClick={handleEmailChange}
                  disabled={saveMutation.isPending}
                  className="text-white"
                  style={{ background: '#8B1A1A' }}
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}