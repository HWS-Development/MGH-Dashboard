import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listProperties, listContacts, listCities } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Pencil, CheckCircle2, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const STATUS_BADGE = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-orange-100 text-orange-700',
  pending: 'bg-blue-100 text-blue-700',
  'ex-member': 'bg-gray-100 text-gray-500',
};
const STATUS_LABEL = {
  active: 'Actif',
  suspended: 'Suspendu',
  pending: 'En attente',
  'ex-member': 'Ex-membre',
};

export default function Properties() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNoEmail, setFilterNoEmail] = useState(false);
  const [filterNoDesc, setFilterNoDesc] = useState(false);
  const [filterNoPhotos, setFilterNoPhotos] = useState(false);

  const { data: propsResult, isLoading: loadingProps } = useQuery({
    queryKey: ['properties-list'],
    queryFn: () => listProperties({ limit: 500 }),
  });
  const { data: contactsResult, isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => listContacts({ limit: 500 }),
  });
  const { data: citiesResult } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
  });

  const parseJson = (val) => {
    if (!val || typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return {}; }
  };

  const properties = (propsResult?.data || []).map(p => ({
    ...p,
    name: parseJson(p.name),
    description: parseJson(p.description),
    image_urls: typeof p.image_urls === 'string' ? (() => { try { return JSON.parse(p.image_urls); } catch { return []; } })() : (p.image_urls || []),
  }));
  const contacts = contactsResult?.data || [];
  const cities = citiesResult?.data || [];

  // Build contacts map: mgh_contacts.supabaseid = mgh_properties_final.id
  const contactsMap = useMemo(() => {
    const m = {};
    contacts.forEach(c => { if (c.supabaseid) m[c.supabaseid] = c; });
    return m;
  }, [contacts]);

  const filtered = useMemo(() => {
    return properties.filter(p => {
      const nameFr = p.name?.fr || p.name || '';
      const c = contactsMap[p.id] || {};
      if (search && !nameFr.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCity !== 'all' && p.city_id !== filterCity) return false;
      if (filterStatus !== 'all' && c.membershipstatus !== filterStatus) return false;
      if (filterNoEmail && c.email) return false;
      if (filterNoDesc && p.description?.fr && p.description.fr.trim() !== '') return false;
      if (filterNoPhotos && p.image_urls && p.image_urls.length > 0) return false;
      return true;
    });
  }, [properties, contactsMap, search, filterCity, filterStatus, filterNoEmail, filterNoDesc, filterNoPhotos]);

  const isLoading = loadingProps || loadingContacts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propriétés</h1>
          <p className="text-sm text-gray-500 mt-0.5">{properties.length} propriétés enregistrées</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              {cities.map(c => (
                <SelectItem key={c.id || c.name} value={c.id || c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="ex-member">Ex-membre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'noEmail', label: 'Sans email', state: filterNoEmail, set: setFilterNoEmail },
            { key: 'noDesc', label: 'Sans description', state: filterNoDesc, set: setFilterNoDesc },
            { key: 'noPhotos', label: 'Sans photos', state: filterNoPhotos, set: setFilterNoPhotos },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => f.set(!f.state)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                f.state
                  ? 'text-white border-transparent'
                  : 'text-gray-600 bg-white border-gray-300 hover:border-gray-400'
              }`}
              style={f.state ? { background: '#8B1A1A', borderColor: '#8B1A1A' } : {}}
            >
              {f.label}
            </button>
          ))}
          <span className="text-xs text-gray-400 self-center ml-2">{filtered.length} résultat(s)</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ville</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Email accès</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Channel Manager</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Photos</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Description</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    Aucune propriété trouvée
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const c = contactsMap[p.id] || {};
                  const nameFr = p.name?.fr || p.name || '—';
                  const status = c.membershipstatus || null;
                  const hasPhotos = p.image_urls && p.image_urls.length > 0;
                  const hasDesc = p.description?.fr && p.description.fr.trim() !== '';
                  const hasEmail = c.email && c.email.trim() !== '';
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{nameFr}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{p.city_id || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{c.contactname || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {hasEmail
                          ? <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                          : <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[100px] truncate">{c.CM || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {status ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABEL[status] || status}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasPhotos
                          ? <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                          : <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasDesc
                          ? <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                          : <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs border-gray-300 hover:border-gray-400"
                          onClick={() => navigate(`/properties/${p.id}`)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Éditer
                        </Button>
                      </td>
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