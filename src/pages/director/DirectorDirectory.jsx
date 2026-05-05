import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';
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

export default function DirectorDirectory({ properties, contacts, isLoading }) {
  const [search, setSearch] = useState('');

  // JOIN: mgh_contacts.supabaseid = mgh_properties_final.id
  const propsMap = useMemo(() => {
    const m = {};
    properties.forEach(p => { if (p.id) m[p.id] = p; });
    return m;
  }, [properties]);

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c => {
      const prop = propsMap[c.supabaseid] || {};
      const name = (prop.name?.fr || '') + (c.contactname || '');
      return name.toLowerCase().includes(q);
    });
  }, [contacts, propsMap, search]);

  const formatDate = (d) => {
    try { return d ? format(new Date(d), 'dd/MM/yyyy') : '—'; } catch { return '—'; }
  };

  const exportCSV = () => {
    const headers = ['Nom riad', 'Contact', 'Email réservation', 'Téléphone propriétaire', 'Channel Manager', 'Statut', 'Membre depuis', 'Renouvellement'];
    const rows = filtered.map(c => {
      const prop = propsMap[c.supabaseid] || {};
      return [
        prop.name?.fr || '—',
        c.contactname || '—',
        prop.email || '—',       // mgh_properties_final.email = reservation email
        c.Telephone || '—',      // mgh_contacts.Telephone
        c.CM || '—',             // mgh_contacts.CM
        STATUS_LABEL[c.membershipstatus] || '—',
        formatDate(c.Membersince),
        formatDate(c.renewaldate),
      ].map(v => `"${v}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mgh_annuaire.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annuaire des membres</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contacts.length} membres — lecture seule</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-sm" onClick={exportCSV}>
          <Download className="w-4 h-4" />Exporter CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, contact…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                {['Nom riad', 'Contact', 'Email réservation', 'Tél propriétaire', 'Channel Manager', 'Statut', 'Membre depuis', 'Renouvellement'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Aucun membre trouvé
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const prop = propsMap[c.supabaseid] || {};
                  let propName = prop.name;
                  if (typeof propName === 'string') { try { propName = JSON.parse(propName); } catch { propName = {}; } }
                  return (
                    <tr key={c.supabaseid} className="border-b border-gray-100 hover:bg-gray-50 text-xs">
                      <td className="px-4 py-2.5 font-medium text-gray-900 max-w-[140px] truncate">
                        {propName?.fr || c.riadname || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{c.contactname || '—'}</td>
                      {/* mgh_properties_final.email = public reservation email */}
                      <td className="px-4 py-2.5 text-gray-500 max-w-[140px] truncate">{prop.email || '—'}</td>
                      {/* mgh_contacts.Telephone */}
                      <td className="px-4 py-2.5 text-gray-500">{c.Telephone || '—'}</td>
                      {/* mgh_contacts.CM */}
                      <td className="px-4 py-2.5 text-gray-500">{c.CM || '—'}</td>
                      <td className="px-4 py-2.5">
                        {c.membershipstatus ? (
                          <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${STATUS_BADGE[c.membershipstatus] || 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABEL[c.membershipstatus] || c.membershipstatus}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">{formatDate(c.Membersince)}</td>
                      <td className="px-4 py-2.5 text-gray-400">{formatDate(c.renewaldate)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}