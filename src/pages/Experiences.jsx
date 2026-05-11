import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Plus, Search, Eye, EyeOff, Pencil, Trash2,
  GripVertical, Globe, MapPin, ArrowUpDown, MoreHorizontal, Loader2,
  ChevronUp, ChevronDown
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
import { listExperiences, deleteExperience, updateExperience, moveExperience } from '@/lib/api';
import { useTranslation } from '@/i18n';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

export default function Experiences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortField, setSortField] = useState('sort_order');
  const [sortDir, setSortDir] = useState('asc');

  // ── Fetch ────────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ['experiences', sortField, sortDir],
    queryFn: () => listExperiences({ order: `${sortField}.${sortDir}` }),
  });

  const experiences = data?.data || [];

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id) => deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast({ title: t('experiences.deleted'), description: t('experiences.deletedDesc') });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
  });

  // ── Toggle publish ───────────────────────────────────────────────────────
  const togglePublish = useMutation({
    mutationFn: ({ id, is_published }) => updateExperience(id, { is_published: !is_published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast({ title: t('experiences.updated'), description: t('experiences.publishStatusUpdated') });
    },
  });

  // ── Move up/down ────────────────────────────────────────────────────────
  const moveMut = useMutation({
    mutationFn: ({ id, direction }) => moveExperience(id, direction),
    onSuccess: (_, { direction }) => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast({
        title: t('experiences.reordered'),
        description: t('experiences.movedDirection', { direction: direction === 'up' ? t('experiences.up') : t('experiences.down') }),
      });
    },
    onError: (err) => {
      toast({ title: t('common.error'), description: err?.response?.data?.error || err.message, variant: 'destructive' });
    },
  });

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = experiences.filter((exp) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const title = typeof exp.title_tr === 'object'
      ? Object.values(exp.title_tr).join(' ')
      : String(exp.title_tr || '');
    return (
      title.toLowerCase().includes(s) ||
      (exp.slug || '').toLowerCase().includes(s) ||
      (typeof exp.destination_tr === 'object'
        ? Object.values(exp.destination_tr).join(' ').toLowerCase().includes(s)
        : false)
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#02162A] via-[#0A3050] to-[#0D4A72] p-8 md:p-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoMnptMC0xMHY2aC0ydi02aDJ6bTAtMTB2Nmgt MnYtNmgyem0wLTEwdjZoLTJWNGgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#9F121A]/20 backdrop-blur-sm flex items-center justify-center">
                <Compass className="w-6 h-6 text-[#9F121A]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                  {t('experiences.title')}
                </h1>
                <p className="text-white/60 text-sm mt-0.5">
                  {t('experiences.subtitle')}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate('/experiences/new')}
            className="bg-[#9F121A] text-[#FFFFFF] hover:bg-[#7A0E14] shadow-lg shadow-black/20 font-semibold gap-2 h-11 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            {t('experiences.newExperience')}
          </Button>
        </div>
        {/* Stats bar */}
        <div className="relative z-10 flex items-center gap-6 mt-8 pt-6 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{experiences.length}</div>
            <div className="text-xs text-white/50 uppercase tracking-wider">{t('common.total')}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-bold text-[#9F121A]">
              {experiences.filter((e) => e.is_published).length}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider">{t('experiences.published')}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">
              {experiences.filter((e) => !e.is_published).length}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider">{t('experiences.drafts')}</div>
          </div>
        </div>
      </div>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('experiences.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 rounded-xl bg-card border-border/50 shadow-sm focus-visible:ring-[#9F121A]/30 transition-shadow"
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive font-medium">{t('common.error')}</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-dashed border-border/50 p-16 text-center"
        >
          <Compass className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground/70">{t('experiences.noExperiences')}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {search ? t('experiences.noResults') : t('experiences.noExperiencesDesc')}
          </p>
          {!search && (
            <Button onClick={() => navigate('/experiences/new')} className="gap-2 bg-[#384252] hover:bg-[#2D3748]">
              <Plus className="w-4 h-4" /> {t('experiences.createExperience')}
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {/* Sort header */}
          <div className="flex items-center gap-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="w-16" />
            <button onClick={() => toggleSort('sort_order')} className="w-16 flex items-center gap-1 hover:text-foreground transition-colors">
              {t('experiences.order')} <ArrowUpDown className="w-3 h-3" />
            </button>
            <div className="flex-1">{t('experiences.titleCol')}</div>
            <div className="w-32">{t('experiences.destination')}</div>
            <div className="w-24 text-center">{t('experiences.statusCol')}</div>
            <div className="w-24 text-center">{t('experiences.languagesCol')}</div>
            <div className="w-20" />
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.map((exp) => (
              <motion.div
                key={exp.id}
                variants={item}
                layout
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                className="group relative flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-[#9F121A]/20 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/experiences/${exp.id}`)}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {exp.hero_image_url ? (
                    <img
                      src={exp.hero_image_url}
                      alt={tr(exp.title_tr)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Compass className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Order with reorder controls */}
                <div className="w-16 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveMut.mutate({ id: exp.id, direction: 'up' })}
                      disabled={exp.sort_order <= 1 || moveMut.isPending}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200
                        ${exp.sort_order <= 1
                          ? 'text-muted-foreground/20 cursor-not-allowed'
                          : 'text-muted-foreground hover:text-[#9F121A] hover:bg-[#9F121A]/10 cursor-pointer'
                        }`}
                      title={t('experiences.moveUp')}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMut.mutate({ id: exp.id, direction: 'down' })}
                      disabled={exp.sort_order >= filtered.length || moveMut.isPending}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200
                        ${exp.sort_order >= filtered.length
                          ? 'text-muted-foreground/20 cursor-not-allowed'
                          : 'text-muted-foreground hover:text-[#9F121A] hover:bg-[#9F121A]/10 cursor-pointer'
                        }`}
                      title={t('experiences.moveDown')}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    {exp.sort_order}
                  </span>
                </div>

                {/* Title & slug */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-[#9F121A] transition-colors">
                    {tr(exp.title_tr)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">
                    /{exp.slug}
                  </p>
                </div>

                {/* Destination */}
                <div className="w-32 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{tr(exp.destination_tr)}</span>
                </div>

                {/* Status */}
                <div className="w-24 flex justify-center">
                  <Badge
                    variant={exp.is_published ? 'default' : 'secondary'}
                    className={`text-[10px] uppercase tracking-wider font-semibold ${
                      exp.is_published
                        ? 'bg-[#9F121A]/15 text-[#9F121A] border-[#9F121A]/30 hover:bg-[#9F121A]/25'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                    }`}
                  >
                    {exp.is_published ? t('common.published') : t('common.draft')}
                  </Badge>
                </div>

                {/* Languages check */}
                <div className="w-24 flex justify-center gap-1">
                  {['fr', 'en', 'es'].map((l) => {
                    const hasLang = exp.title_tr && typeof exp.title_tr === 'object' && exp.title_tr[l];
                    return (
                      <span
                        key={l}
                        className={`text-[10px] font-bold uppercase w-6 h-5 rounded flex items-center justify-center ${
                          hasLang
                            ? 'bg-[#9F121A]/15 text-[#9F121A]'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {l}
                      </span>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="w-20 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate(`/experiences/${exp.id}`)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => togglePublish.mutate({ id: exp.id, is_published: exp.is_published })}
                      >
                        {exp.is_published
                          ? <><EyeOff className="w-3.5 h-3.5 mr-2" /> {t('experiences.unpublish')}</>
                          : <><Eye className="w-3.5 h-3.5 mr-2" /> {t('experiences.publish')}</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(exp)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Hover accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#9F121A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Delete Dialog ────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('experiences.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('experiences.deleteConfirmDesc', { name: deleteTarget && tr(deleteTarget.title_tr) }).split('<strong>').join('').split('</strong>').join('')}
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
