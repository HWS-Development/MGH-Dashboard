import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listContacts, listCities, updateContact } from '@/lib/api';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/i18n';

const STATUS_BADGE = {
  active: 'bg-primary/15 text-primary',
  suspended: 'bg-orange-500/15 text-orange-400',
  pending: 'bg-slate-500/15 text-slate-600',
  'ex-member': 'bg-muted text-muted-foreground',
};

function getStatusLabel(t) {
  return {
    active: t('members.active'),
    suspended: t('members.suspended'),
    pending: t('members.pending'),
    'ex-member': t('members.exMember'),
  };
}

function InlineEdit({ value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value || '');
  if (!editing) {
    return (
      <span
        className="cursor-pointer hover:underline text-foreground/80 text-xs"
        onClick={() => { setV(value || ''); setEditing(true); }}
      >
        {value || <span className="text-muted-foreground/60 italic">—</span>}
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
      className="border border-slate-400 rounded px-1 py-0.5 text-xs w-full focus:outline-none"
    />
  );
}

function InlineSelect({ value, options, onSave, statusLabel }) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${STATUS_BADGE[value] || 'bg-muted text-muted-foreground'}`}
        onClick={() => setEditing(true)}
      >
        {statusLabel[value] || value || '—'}
      </span>
    );
  }
  return (
    <select
      autoFocus
      value={value || ''}
      onChange={e => { onSave(e.target.value); setEditing(false); }}
      onBlur={() => setEditing(false)}
      className="border border-slate-400 rounded px-1 py-0.5 text-xs focus:outline-none"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function Members() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterNoEmail, setFilterNoEmail] = useState(false);
  const [emailModal, setEmailModal] = useState(null);
  const [newEmail, setNewEmail] = useState('');

  const STATUS_LABEL = getStatusLabel(t);

  const { data: contactsResult, isLoading: loadingContacts } = useQuery({
    queryKey: ['members-contacts'],
    queryFn: () => listContacts({ limit: 500 }),
  });
  const { data: rawProperties = [] } = usePartnerHotels();
  const { data: citiesResult } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
  });

  const contacts = contactsResult?.data || [];
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
      // JOIN: mgh_contacts.property_id = mgh_properties_final.id
      const prop = propsMap[c.property_id] || {};
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
      toast({ title: t('members.saved') });
    },
  });

  // handleSave uses property_id as the row identifier
  const handleSave = (propertyId, field, value) => {
    saveMutation.mutate({ id: propertyId, data: { [field]: value } });
  };

  const handleEmailChange = () => {
    if (!newEmail || !emailModal) return;
    // Update mgh_contacts.email (access email — HWS managed)
    saveMutation.mutate({ id: emailModal.property_id, data: { email: newEmail } });
    setEmailModal(null);
  };

  const handleInvite = async (contact) => {
    const email = contact.email;
    if (!email) {
      toast({ title: t('members.noEmail'), description: t('members.noEmailDesc'), variant: 'destructive' });
      return;
    }
    try {
      await base44.functions.invoke('sendInvitationEmail', {
        to: email,
        contactname: contact.contactname || '',
      });
      toast({ title: t('members.inviteSent'), description: t('members.inviteSentDesc', { email }) });
    } catch (err) {
      toast({
        title: t('members.inviteFailed'),
        description: err?.response?.data?.error ? JSON.stringify(err.response.data.error) : (err?.message || String(err)),
        variant: 'destructive',
      });
    }
  };

  const exportCSV = () => {
    const headers = ['property_id', 'riadname', 'contactname', 'email', 'Telephone', 'CM',
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
          <h1 className="text-2xl font-bold text-foreground">{t('members.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('members.memberCount', { count: contacts.length })}</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-sm" onClick={exportCSV}>
          <Download className="w-4 h-4" />
          {t('members.exportCsv')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-primary/10 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('members.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t('members.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('members.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('members.active')}</SelectItem>
            <SelectItem value="suspended">{t('members.suspended')}</SelectItem>
            <SelectItem value="pending">{t('members.pending')}</SelectItem>
            <SelectItem value="ex-member">{t('members.exMember')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t('members.allCities')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('members.allCities')}</SelectItem>
            {cities.map(c => (
              <SelectItem key={c.id || c.name} value={c.id || c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => setFilterNoEmail(!filterNoEmail)}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            filterNoEmail ? 'text-white border-transparent' : 'text-muted-foreground bg-transparent border-border'
          }`}
          style={filterNoEmail ? { background: 'hsl(var(--primary))' } : {}}
        >
          {t('members.noEmailAccess')}
        </button>
        <span className="text-xs text-muted-foreground">{t('members.results', { count: filtered.length })}</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-primary/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs">
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.riad')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.contact')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.platformAccessEmail')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.phone')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.channelManager')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.status')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.since')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.renewal')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.notes')}</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground">{t('members.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingContacts ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-3 py-3"><Skeleton className="h-3 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">{t('members.noMembersFound')}</td>
                </tr>
              ) : (
                filtered.map(c => {
                  const prop = propsMap[c.property_id] || {};
                  const riadName = prop.name?.fr || c.riadname || '—';
                  return (
                    <tr key={c.property_id} className="border-b border-border/50 hover:bg-muted/50 text-xs">
                      <td className="px-3 py-2 font-medium text-foreground max-w-[120px] truncate">{riadName}</td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[100px]">
                        {/* contactname — editable */}
                        <InlineEdit value={c.contactname} onSave={v => handleSave(c.property_id, 'contactname', v)} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[140px] truncate">
                        {/* mgh_contacts.email = access email — shown but edit via modal */}
                        {c.email || <span className="text-amber-400 font-medium">{t('members.empty')}</span>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {/* Telephone */}
                        <InlineEdit value={c.Telephone} onSave={v => handleSave(c.property_id, 'Telephone', v)} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {/* CM */}
                        <InlineEdit value={c.CM} onSave={v => handleSave(c.property_id, 'CM', v)} />
                      </td>
                      <td className="px-3 py-2">
                        <InlineSelect
                          value={c.membershipstatus}
                          statusLabel={STATUS_LABEL}
                          options={[
                            { value: 'active', label: t('members.active') },
                            { value: 'suspended', label: t('members.suspended') },
                            { value: 'pending', label: t('members.pending') },
                            { value: 'ex-member', label: t('members.exMember') },
                          ]}
                          onSave={v => handleSave(c.property_id, 'membershipstatus', v)}
                        />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(c.Membersince)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(c.renewaldate)}</td>
                      <td className="px-3 py-2 max-w-[120px]">
                        <InlineEdit value={c.mghnotes} onSave={v => handleSave(c.property_id, 'mghnotes', v)} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs whitespace-nowrap"
                            onClick={() => { setEmailModal(c); setNewEmail(c.email || ''); }}
                          >
                            <Mail className="w-3 h-3 mr-0.5" />{t('members.email')}
                          </Button>
                          <Button
                           size="sm"
                           variant="ghost"
                           className="h-6 px-2 text-xs text-[#384252]"
                           onClick={() => handleInvite(c)}
                          >
                           {t('members.invite')}
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
              <DialogTitle>{t('members.editAccessEmail')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                {t('members.contactLabel')} <strong>{emailModal.contactname}</strong>
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-400">
                {t('members.emailWarning')}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-1">{t('members.newAccessEmail')}</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEmailModal(null)}>{t('common.cancel')}</Button>
                <Button
                  onClick={handleEmailChange}
                  disabled={saveMutation.isPending}
                  className="text-white"
                  style={{ background: 'hsl(var(--primary))' }}
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
