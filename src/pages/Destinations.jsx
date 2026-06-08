import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Plus, Search, Eye, EyeOff, Pencil, Trash2,
  Globe, ArrowUpDown, MoreHorizontal, Loader2,
  ChevronUp, ChevronDown, Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { listDestinations, deleteDestination, updateDestination, moveDestination } from '@/lib/api';
import { useTranslation } from '@/i18n';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 28 } },
};

export default function Destinations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortField, setSortField] = useState('sort_order');
  const [sortDir, setSortDir] = useState('asc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['destinations', sortField, sortDir],
    queryFn: () => listDestinations({ order: `${sortField}.${sortDir}` }),
  });

  const destinations = data?.data || [];

  const deleteMut = useMutation({
    mutationFn: (id) => deleteDestination(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      toast({ title: t('destinations.deleted'), description: t('destinations.deletedDesc') });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, is_published }) => updateDestination(id, { is_published: !is_published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      toast({ title: t('destinations.updated'), description: t('destinations.publishStatusUpdated') });
    },
  });

  const moveMut = useMutation({
    mutationFn: ({ id, direction }) => moveDestination(id, direction),
    onSuccess: (_, { direction }) => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      toast({
        title: t('destinations.reordered'),
        description: t('destinations.movedDirection', { direction: direction === 'up' ? t('destinations.up') : t('destinations.down') }),
      });
    },
    onError: (err) => {
      toast({ title: t('common.error'), description: err?.response?.data?.error || err.message, variant: 'destructive' });
    },
  });

  const filtered = destinations.filter((dest) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = typeof dest.name === 'object'
      ? Object.values(dest.name).join(' ')
      : String(dest.name || '');
    return (
      name.toLowerCase().includes(s) ||
      (dest.slug || '').toLowerCase().includes(s)
    );
  });

  const tr = (obj) => {
    if (!obj || typeof obj !== 'object') return String(obj || '');
    return obj[lang] || obj.fr || obj.en || '';
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-coral-50 via-white to-coral-50/50 p-8 md:p-10 border border-coral-100/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-coral-200/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-coral-100 flex items-center justify-center">
                <Compass className="w-7 h-7 text-coral-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-coral-900 tracking-tight">
                  {t('destinations.title')}
                </h1>
                <p className="text-coral-400/80 text-sm mt-0.5 font-display italic">
                  {t('destinations.subtitle')}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate('/destinations/new')}
            className="bg-coral-500 hover:bg-coral-600 text-white shadow-lg shadow-coral-500/20 font-semibold gap-2 h-11 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            {t('destinations.newDestination')}
          </Button>
        </div>
        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="relative z-10 flex items-center gap-8 mt-8 pt-6 border-t border-coral-200/30">
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-coral-900">{destinations.length}</div>
            <div className="text-[10px] text-coral-400/60 uppercase tracking-[0.2em] font-medium">{t('common.total')}</div>
          </div>
          <div className="w-px h-8 bg-coral-200/30" />
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-coral-500">
              {destinations.filter((d) => d.is_published).length}
            </div>
            <div className="text-[10px] text-coral-400/60 uppercase tracking-[0.2em] font-medium">{t('destinations.published')}</div>
          </div>
          <div className="w-px h-8 bg-coral-200/30" />
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-amber-400">
              {destinations.filter((d) => !d.is_published).length}
            </div>
            <div className="text-[10px] text-coral-400/60 uppercase tracking-[0.2em] font-medium">{t('destinations.drafts')}</div>
          </div>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-coral-400/60" />
        <Input
          placeholder={t('destinations.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 rounded-xl bg-card/80 border-border/40 shadow-sm focus-visible:ring-coral-500/30 transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-3 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-destructive/60" />
          </div>
          <p className="font-display text-lg font-semibold text-destructive">{t('common.error')}</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['destinations'] })} className="mt-4">
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-dashed border-coral-200/50 p-16 text-center bg-gradient-to-b from-coral-50/30 to-transparent"
        >
          <div className="w-16 h-16 rounded-full bg-coral-100 mx-auto mb-4 flex items-center justify-center">
            <Compass className="w-7 h-7 text-coral-400" />
          </div>
          <h3 className="font-display text-xl font-semibold text-coral-800/70">{t('destinations.noDestinations')}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {search ? t('destinations.noResults') : t('destinations.noDestinationsDesc')}
          </p>
          {!search && (
            <Button onClick={() => navigate('/destinations/new')} className="gap-2 bg-coral-500 hover:bg-coral-600 text-white">
              <Plus className="w-4 h-4" /> {t('destinations.createDestination')}
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          <div className="flex items-center gap-4 px-4 text-[11px] font-medium text-coral-400/60 uppercase tracking-[0.15em]">
            <div className="w-16" />
            <button onClick={() => toggleSort('sort_order')} className="w-16 flex items-center gap-1 hover:text-coral-500 transition-colors">
              #{t('destinations.order')} <ArrowUpDown className="w-3 h-3" />
            </button>
            <div className="flex-1">{t('destinations.nameCol')}</div>
            <div className="w-24 text-center">{t('destinations.statusCol')}</div>
            <div className="w-24 text-center">{t('destinations.languagesCol')}</div>
            <div className="w-20" />
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.map((dest, index) => (
              <motion.div
                key={dest.id}
                variants={item}
                layout
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                className="group relative flex items-center gap-4 p-4 rounded-xl bg-card border border-border/40 shadow-sm hover:shadow-lg hover:border-coral-300/50 transition-all duration-400 cursor-pointer"
                onClick={() => navigate(`/destinations/${dest.id}`)}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-coral-100/20 to-coral-200/10 ring-1 ring-coral-200/30">
                  {dest.hero_image_urls && dest.hero_image_urls.length > 0 ? (
                    <img
                      src={dest.hero_image_urls[0]}
                      alt={tr(dest.name)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Compass className="w-6 h-6 text-coral-300" />
                    </div>
                  )}
                </div>

                <div className="w-16 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveMut.mutate({ id: dest.id, direction: 'up' })}
                      disabled={dest.sort_order <= 1 || moveMut.isPending}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
                        dest.sort_order <= 1
                          ? 'text-muted-foreground/20 cursor-not-allowed'
                          : 'text-muted-foreground hover:text-coral-500 hover:bg-coral-100 cursor-pointer'
                      }`}
                      title={t('destinations.moveUp')}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMut.mutate({ id: dest.id, direction: 'down' })}
                      disabled={dest.sort_order >= filtered.length || moveMut.isPending}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
                        dest.sort_order >= filtered.length
                          ? 'text-muted-foreground/20 cursor-not-allowed'
                          : 'text-muted-foreground hover:text-coral-500 hover:bg-coral-100 cursor-pointer'
                      }`}
                      title={t('destinations.moveDown')}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-coral-100 text-coral-600 text-xs font-bold">
                    {dest.sort_order}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-semibold text-foreground truncate group-hover:text-coral-600 transition-colors">
                    {tr(dest.name)}
                  </h3>
                  <p className="text-xs text-muted-foreground/60 mt-0.5 truncate font-mono">
                    /{dest.slug}
                  </p>
                </div>

                <div className="w-24 flex justify-center">
                  <Badge
                    variant={dest.is_published ? 'default' : 'secondary'}
                    className={`text-[10px] uppercase tracking-[0.1em] font-semibold px-3 py-1 ${
                      dest.is_published
                        ? 'bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200'
                        : 'bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-200'
                    }`}
                  >
                    {dest.is_published ? t('common.published') : t('common.draft')}
                  </Badge>
                </div>

                <div className="w-24 flex justify-center gap-1.5">
                  {['fr', 'en', 'es'].map((l) => {
                    const hasLang = dest.name && typeof dest.name === 'object' && dest.name[l];
                    return (
                      <span
                        key={l}
                        className={`text-[10px] font-bold uppercase w-6 h-5 rounded flex items-center justify-center transition-colors ${
                          hasLang
                            ? 'bg-coral-100 text-coral-600'
                            : 'bg-red-100 text-red-400'
                        }`}
                      >
                        {l}
                      </span>
                    );
                  })}
                </div>

                <div className="w-20 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-coral-400 hover:text-coral-600 hover:bg-coral-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-coral-200">
                      <DropdownMenuItem onClick={() => navigate(`/destinations/${dest.id}`)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => togglePublish.mutate({ id: dest.id, is_published: dest.is_published })}
                      >
                        {dest.is_published
                          ? <><EyeOff className="w-3.5 h-3.5 mr-2" /> {t('destinations.unpublish')}</>
                          : <><Eye className="w-3.5 h-3.5 mr-2" /> {t('destinations.publish')}</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(dest)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-gradient-to-b from-coral-400 to-coral-500 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Delete Dialog ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="border-coral-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t('destinations.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('destinations.deleteConfirmDesc', { name: deleteTarget && tr(deleteTarget.name) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMut.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
