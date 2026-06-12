import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listContacts, listCities, listPropertyTypes } from '@/lib/api';
import { usePartnerHotels, extractCentraHotelId } from '@/lib/partnerHotelsApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Pencil, Eye, CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Filter, Building2, ArrowUpRight } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const STATUS_BADGE = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  suspended: 'bg-amber-500/10 text-amber-600 border-amber-200',
  pending: 'bg-slate-500/10 text-slate-600 border-slate-200',
  'ex-member': 'bg-muted text-muted-foreground border-border',
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
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
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
  const { data: propertyTypesResult } = useQuery({
    queryKey: ['property-types'],
    queryFn: listPropertyTypes,
  });

  const properties = rawProperties.map(p => ({
    ...p,
    name: typeof p.name === 'string' ? (() => { try { return JSON.parse(p.name); } catch { return null; } })() : (p.name || null),
    description: typeof p.description === 'string' ? (() => { try { return JSON.parse(p.description); } catch { return null; } })() : (p.description || null),
    image_urls: typeof p.image_urls === 'string' ? (() => { try { return JSON.parse(p.image_urls); } catch { return []; } })() : (p.image_urls || []),
    centraHotelId: p.hotelId || extractCentraHotelId(p.image_urls),
  }));
  const contacts = contactsResult?.data || [];
  const cities = citiesResult?.data || [];

  const propertyTypes = propertyTypesResult?.data || [];

  const contactsMap = useMemo(() => {
    const m = {};
    contacts.forEach(c => { if (c.property_id) m[c.property_id] = c; });
    return m;
  }, [contacts]);

  const citiesMap = useMemo(() => {
    const m = {};
    cities.forEach(c => { m[c.id] = c.label?.fr || c.name || c.id; });
    return m;
  }, [cities]);

  const propertyTypesMap = useMemo(() => {
    const m = {};
    propertyTypes.forEach(t => { m[t.id] = t.label?.fr || t.name || t.id; });
    return m;
  }, [propertyTypes]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCity, filterStatus, filterNoEmail, filterNoDesc, filterNoPhotos]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const isLoading = loadingProps || loadingContacts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Propriétés
          </h1>
          <p className="page-subtitle mt-0.5">{properties.length} propriétés enregistrées</p>
        </div>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterCity} onValueChange={(v) => { setFilterCity(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {cities.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.label?.fr || c.name || c.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'border-primary text-primary' : ''}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtres
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-1">
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
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'text-muted-foreground bg-transparent border-border hover:border-primary/30'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length} résultat(s)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Nom</th>
                <th className="text-left px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Ville</th>
                <th className="hidden sm:table-cell text-left px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Contact</th>
                <th className="hidden sm:table-cell text-center px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Email</th>
                <th className="hidden md:table-cell text-left px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">CM</th>
                <th className="text-center px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Statut</th>
                <th className="hidden md:table-cell text-center px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Photos</th>
                <th className="hidden lg:table-cell text-center px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Description</th>
                <th className="hidden lg:table-cell text-left px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Type</th>
                <th className="text-center px-2 md:px-4 py-2 md:py-3 font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    Aucune propriété trouvée
                  </td>
                </tr>
              ) : (
                  paginatedItems.map(p => {
                    const c = contactsMap[p.id] || {};
                    const nameFr = p.name?.fr || p.name?.en || p.name?.es || '—';
                    const status = c.membershipstatus || null;
                    const hasPhotos = p.image_urls && p.image_urls.length > 0;
                    const hasDesc = p.description?.fr && p.description.fr.trim() !== '';
                    const hasEmail = c.email && c.email.trim() !== '';
                    return (
                      <React.Fragment key={p.id}>
                      <tr
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                      <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-foreground truncate max-w-[120px] md:max-w-[160px]">{nameFr}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-muted-foreground capitalize truncate max-w-[80px] md:max-w-none">{citiesMap[p.city_id] || p.city_id || '—'}</td>
                      <td className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-3 text-muted-foreground truncate max-w-[120px]">{c.contactname || '—'}</td>
                      <td className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-3 text-center">
                        {hasEmail
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          : <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto" />
                        }
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-4 py-2 md:py-3 text-muted-foreground truncate max-w-[100px]">{c.CM || '—'}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                        {status ? (
                          <span className={`text-[10px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full border font-medium ${STATUS_BADGE[status] || 'bg-muted text-muted-foreground border-border'}`}>
                            {STATUS_LABEL[status] || status}
                          </span>
                        ) : <span className="text-muted-foreground/60 text-[10px] md:text-xs">—</span>}
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-4 py-2 md:py-3 text-center">
                        {hasPhotos
                          ? <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 mx-auto" />
                          : <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/40 mx-auto" />
                        }
                      </td>
                      <td className="hidden lg:table-cell px-2 md:px-4 py-2 md:py-3 text-center">
                        {hasDesc
                          ? <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 mx-auto" />
                          : <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/40 mx-auto" />
                        }
                      </td>
                      <td className="hidden lg:table-cell px-2 md:px-4 py-2 md:py-3 text-muted-foreground truncate max-w-[120px]">{propertyTypesMap[p.property_type_id] || p.property_type || '—'}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                        <div className="flex items-center justify-center gap-1 md:gap-1.5">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="h-6 md:h-7 px-1.5 md:px-3 text-[10px] md:text-xs opacity-50 cursor-not-allowed"
                                  onClick={() => navigate(`/properties/${p.id}`)}
                                >
                                  <Pencil className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                                  <span className="hidden sm:inline">Éditer</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Édition désactivée — voir les détails
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span
                            onClick={() => navigate(`/properties/${p.centraHotelId || p.id}/details`)}
                            className="group inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.15em] text-coral-500/50 hover:text-coral-500 cursor-pointer transition-all duration-300 hover:scale-105"
                          >
                            <Eye className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            <span className="relative hidden sm:inline">
                              Détails
                              <span className="absolute -bottom-px left-0 right-0 h-px bg-coral-500/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                            </span>
                            <ArrowUpRight className="w-2 h-2 md:w-2.5 md:h-2.5 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hidden sm:block" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
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
                      className={`h-7 w-7 p-0 text-xs`}
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
      </Card>
    </div>
  );
}
