import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listContacts, listCities } from '@/lib/api';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Pencil, CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const STATUS_BADGE = {
  active: 'bg-[#9F121A]/15 text-[#9F121A]',
  suspended: 'bg-orange-500/15 text-orange-400',
  pending: 'bg-slate-500/15 text-slate-600',
  'ex-member': 'bg-muted text-muted-foreground',
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const { data: rawProperties = [], isLoading: loadingProps } = usePartnerHotels();
  const { data: contactsResult, isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => listContacts({ limit: 500 }),
  });
  const { data: citiesResult } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
  });

  const properties = rawProperties.map(p => ({
    ...p,
    name: typeof p.name === 'string' ? (() => { try { return JSON.parse(p.name); } catch { return {}; } })() : (p.name || {}),
    description: typeof p.description === 'string' ? (() => { try { return JSON.parse(p.description); } catch { return {}; } })() : (p.description || {}),
    image_urls: typeof p.image_urls === 'string' ? (() => { try { return JSON.parse(p.image_urls); } catch { return []; } })() : (p.image_urls || []),
  }));
  const contacts = contactsResult?.data || [];
  const cities = citiesResult?.data || [];

  // Build contacts map: mgh_contacts.property_id = mgh_properties_final.id
  const contactsMap = useMemo(() => {
    const m = {};
    contacts.forEach(c => { if (c.property_id) m[c.property_id] = c; });
    return m;
  }, [contacts]);

  // Build cities map for display
  const citiesMap = useMemo(() => {
    const m = {};
    cities.forEach(c => { m[c.id] = c.label?.fr || c.name || c.id; });
    return m;
  }, [cities]);

  const filtered = useMemo(() => {
    return properties.filter(p => {
      const nameFr = p.name?.fr || p.name || '';
      const c = contactsMap[p.id] || {};
      if (search && !nameFr.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCity !== 'all' && String(p.city_id) !== filterCity) return false;
      if (filterStatus !== 'all' && c.membershipstatus !== filterStatus) return false;
      if (filterNoEmail && c.email) return false;
      if (filterNoDesc && p.description?.fr && p.description.fr.trim() !== '') return false;
      if (filterNoPhotos && p.image_urls && p.image_urls.length > 0) return false;
      return true;
    });
  }, [properties, contactsMap, search, filterCity, filterStatus, filterNoEmail, filterNoDesc, filterNoPhotos]);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCity, filterStatus, filterNoEmail, filterNoDesc, filterNoPhotos]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const isLoading = loadingProps || loadingContacts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-heading">Propriétés</h1>
          <p className="text-sm text-brand-subtitle mt-0.5">{properties.length} propriétés enregistrées</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-dark border border-[#9F121A]/10 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                <SelectItem key={c.id} value={String(c.id)}>{c.label?.fr || c.name || c.id}</SelectItem>
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
                  : 'text-muted-foreground bg-transparent border-border hover:border-border'
              }`}
              style={f.state ? { background: '#9F121A', borderColor: '#9F121A' } : {}}
            >
              {f.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground self-center ml-2">{filtered.length} résultat(s)</span>
        </div>
      </div>

      {/* Table */}
      <div className="card-dark border border-[#9F121A]/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ville</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Contact</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Email accès</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Channel Manager</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Statut</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Photos</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Description</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    Aucune propriété trouvée
                  </td>
                </tr>
              ) : (
                paginatedItems.map(p => {
                  const c = contactsMap[p.id] || {};
                  const nameFr = p.name?.fr || p.name || '—';
                  const status = c.membershipstatus || null;
                  const hasPhotos = p.image_urls && p.image_urls.length > 0;
                  const hasDesc = p.description?.fr && p.description.fr.trim() !== '';
                  const hasEmail = c.email && c.email.trim() !== '';
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">{nameFr}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{citiesMap[p.city_id] || p.city_id || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">{c.contactname || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {hasEmail
                          ? <CheckCircle2 className="w-4 h-4 text-[#9F121A] mx-auto" />
                          : <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto" />
                        }
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[100px] truncate">{c.CM || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {status ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[status] || 'bg-muted text-muted-foreground'}`}>
                            {STATUS_LABEL[status] || status}
                          </span>
                        ) : <span className="text-muted-foreground/60 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasPhotos
                          ? <CheckCircle2 className="w-4 h-4 text-[#9F121A] mx-auto" />
                          : <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasDesc
                          ? <CheckCircle2 className="w-4 h-4 text-[#9F121A] mx-auto" />
                          : <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs border-border hover:border-[#9F121A]/30 text-muted-foreground hover:text-[#9F121A]"
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

        {/* Pagination */}
        {!isLoading && filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {(() => {
                const pages = [];
                const siblings = 1;
                const showFirst = 1;
                const showLast = totalPages;
                const rangeStart = Math.max(2, currentPage - siblings);
                const rangeEnd = Math.min(totalPages - 1, currentPage + siblings);

                pages.push(showFirst);
                if (rangeStart > 2) pages.push('start-ellipsis');
                for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
                if (rangeEnd < totalPages - 1) pages.push('end-ellipsis');
                if (totalPages > 1) pages.push(showLast);

                return pages.map((page) => {
                  if (typeof page === 'string') {
                    return (
                      <span key={page} className="h-7 w-5 flex items-center justify-center text-xs text-muted-foreground select-none">
                        ...
                      </span>
                    );
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 w-7 p-0 text-xs ${page === currentPage ? 'bg-[#9F121A] text-white hover:bg-[#7A0E14]' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                });
              })()}
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}