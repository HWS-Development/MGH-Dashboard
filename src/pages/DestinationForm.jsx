import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ArrowLeft, ArrowRight, Check, Save, Loader2,
  X, Plus, Trash2, GripVertical, Globe, Image as ImageIcon,
  Calendar, Search as SearchIcon, FileText, Tag, AlertCircle,
  Link2, Sparkles, Navigation, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { getDestination, insertDestination, updateDestination, uploadDestinationImage, deleteDestinationImage, getNextDestinationOrder, reorderDestination, listDestinations } from '@/lib/api';
import { usePartnerHotels, usePartnerHotelContent } from '@/lib/partnerHotelsApi';
import { useTranslation } from '@/i18n';

// ─── Constants ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'fr', label: 'Francais', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'en', label: 'English', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'es', label: 'Espanol', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
];

const STEPS = [
  { id: 'identity', labelKey: 'destinationForm.steps.identity', descKey: 'destinationForm.steps.identityDesc', icon: Tag },
  { id: 'content', labelKey: 'destinationForm.steps.content', descKey: 'destinationForm.steps.contentDesc', icon: FileText },
  { id: 'getting_here', labelKey: 'destinationForm.steps.gettingHere', descKey: 'destinationForm.steps.gettingHereDesc', icon: Navigation },
  { id: 'activities', labelKey: 'destinationForm.steps.activities', descKey: 'destinationForm.steps.activitiesDesc', icon: Sparkles },
  { id: 'tips_faq', labelKey: 'destinationForm.steps.tipsFaq', descKey: 'destinationForm.steps.tipsFaqDesc', icon: AlertCircle },
  { id: 'media', labelKey: 'destinationForm.steps.media', descKey: 'destinationForm.steps.mediaDesc', icon: ImageIcon },
  { id: 'seo', labelKey: 'destinationForm.steps.seo', descKey: 'destinationForm.steps.seoDesc', icon: SearchIcon },
];

const EMPTY_TR = { fr: '', en: '', es: '' };
const EMPTY_FORM = {
  slug: '',
  is_published: false,
  sort_order: 1,
  name: { fr: '', en: '', es: '' },
  subtitle: { fr: '', en: '', es: '' },
  intro_rich: { fr: '', en: '', es: '' },
  getting_here: { fr: [], en: [], es: [] },
  what_to_do: { fr: [], en: [], es: [] },
  good_to_know: { fr: [], en: [], es: [] },
  when_to_visit: { fr: '', en: '', es: '' },
  faq: { fr: [], en: [], es: [] },
  hero_image_urls: [],
  best_months: [],
  gallery_urls: [],
  map_embed_url: '',
  related_experiences: [],
  related_collections: [],
  cta_label: { fr: '', en: '', es: '' },
  cta_url: '',
  seo_title: { fr: '', en: '', es: '' },
  seo_description: { fr: '', en: '', es: '' },
  seo_keywords: { fr: '', en: '', es: '' },
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function ensureObj(val, defaultVal) {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val;
  return defaultVal;
}

function ensureArr(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validateStep(step, form, t) {
  const errors = {};

  switch (step) {
    case 0: // Identity
      if (!form.slug || form.slug.trim().length < 2) {
        errors.slug = t('destinationForm.validation.slugRequired');
      } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) {
        errors.slug = t('destinationForm.validation.slugFormat');
      }
      if (!form.name?.fr?.trim()) errors['name.fr'] = t('destinationForm.validation.nameRequired', { lang: t('languages.fr') });
      if (!form.name?.en?.trim()) errors['name.en'] = t('destinationForm.validation.nameRequired', { lang: t('languages.en') });
      if (!form.name?.es?.trim()) errors['name.es'] = t('destinationForm.validation.nameRequired', { lang: t('languages.es') });
      if (form.sort_order < 1) errors.sort_order = t('destinationForm.validation.sortOrderPositive');
      break;
    case 1: // Content
      if (!form.intro_rich?.fr?.trim()) errors['intro_rich.fr'] = t('destinationForm.validation.introRequired', { lang: t('languages.fr') });
      break;
    case 2: // Getting Here
      if (!form.getting_here?.fr?.length) {
        errors['getting_here.fr'] = t('destinationForm.validation.atLeastOneTransport');
      } else {
        form.getting_here.fr.forEach((item, i) => {
          if (!item.mode?.trim()) errors[`getting_here.fr.${i}.mode`] = t('destinationForm.validation.modeRequired', { n: i + 1 });
          if (!item.description?.trim()) errors[`getting_here.fr.${i}.description`] = t('destinationForm.validation.descriptionRequired', { n: i + 1 });
        });
      }
      break;
    case 3: // Activities
      if (!form.what_to_do?.fr?.length) {
        errors['what_to_do.fr'] = t('destinationForm.validation.atLeastOneActivity');
      } else {
        form.what_to_do.fr.forEach((item, i) => {
          if (!item.title?.trim()) errors[`what_to_do.fr.${i}.title`] = t('destinationForm.validation.activityTitleRequired', { n: i + 1 });
          if (!item.blurb?.trim()) errors[`what_to_do.fr.${i}.blurb`] = t('destinationForm.validation.activityBlurbRequired', { n: i + 1 });
        });
      }
      break;
    case 4: // Tips & FAQ — optional, no validation
      break;
    case 5: // Media
      if (form.hero_image_urls?.length) {
        form.hero_image_urls.forEach((url, i) => {
          if (url.trim()) {
            try { new URL(url); }
            catch { errors[`hero_image_urls.${i}`] = t('destinationForm.validation.invalidImageUrl', { n: i + 1 }); }
          }
        });
      }
      if (form.gallery_urls?.length) {
        form.gallery_urls.forEach((url, i) => {
          if (url.trim()) {
            try { new URL(url); }
            catch { errors[`gallery_urls.${i}`] = t('destinationForm.validation.invalidImageUrl', { n: i + 1 }); }
          }
        });
      }
      break;
    case 6: // SEO - no required fields
      break;
  }
  return errors;
}

// ─── Multilingual input component ──────────────────────────────────────────────

function MultiLangInput({ label, field, form, setForm, type = 'input', required = false, helpText, errors = {} }) {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState('fr');

  const setValue = (lang, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: { ...ensureObj(prev[field], EMPTY_TR), [lang]: value },
    }));
  };

  const currentVal = ensureObj(form[field], EMPTY_TR);
  const Comp = type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex rounded-lg border border-border/50 overflow-hidden shadow-sm">
          {LANGUAGES.map((lang) => {
            const hasErr = errors[`${field}.${lang.code}`];
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`px-2.5 py-1 text-xs font-medium transition-all duration-200 relative
                  ${activeLang === lang.code
                    ? 'bg-[#384252] text-white'
                    : hasErr
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : currentVal[lang.code]?.trim()
                    ? 'bg-primary/15 text-primary hover:bg-primary/25'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
              >
                {lang.flag} {lang.code.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLang}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          <Comp
            value={currentVal[activeLang] || ''}
            onChange={(e) => setValue(activeLang, e.target.value)}
            placeholder={`${label} (${LANGUAGES.find((l) => l.code === activeLang)?.label})`}
            className={`transition-all duration-200 ${
              errors[`${field}.${activeLang}`]
                ? 'border-destructive ring-1 ring-destructive/30'
                : 'focus-visible:ring-primary/30'
            } ${type === 'textarea' ? 'min-h-[120px] resize-y' : ''}`}
          />
          {errors[`${field}.${activeLang}`] && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors[`${field}.${activeLang}`]}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}

      {/* Completeness dots */}
      <div className="flex items-center gap-1.5 mt-1">
        {LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              currentVal[lang.code]?.trim() ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">
          {t('destinationForm.langCompleteness', { filled: LANGUAGES.filter((l) => currentVal[l.code]?.trim()).length })}
        </span>
      </div>
    </div>
  );
}

// ─── Multilingual array manager ────────────────────────────────────────────────

function MultiLangArrayEditor({
  label,
  field,
  form,
  setForm,
  itemFields,
  errors = {},
  required = false,
}) {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState('fr');
  const data = form[field] || { fr: [], en: [], es: [] };
  const items = Array.isArray(data[activeLang]) ? data[activeLang] : [];

  const setItems = (lang, newItems) => {
    setForm((prev) => ({
      ...prev,
      [field]: { ...ensureObj(prev[field], { fr: [], en: [], es: [] }), [lang]: newItems },
    }));
  };

  const addItem = () => {
    const empty = {};
    itemFields.forEach((f) => (empty[f.key] = ''));
    setItems(activeLang, [...items, empty]);
  };

  const removeItem = (idx) => {
    setItems(activeLang, items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, key, value) => {
    const updated = items.map((item, i) => (i === idx ? { ...item, [key]: value } : item));
    setItems(activeLang, updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex rounded-lg border border-border/50 overflow-hidden shadow-sm">
          {LANGUAGES.map((lang) => {
            const langData = Array.isArray(data[lang.code]) ? data[lang.code] : [];
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`px-2.5 py-1 text-xs font-medium transition-all duration-200
                  ${activeLang === lang.code
                    ? 'bg-[#384252] text-white'
                    : langData.length > 0
                    ? 'bg-primary/15 text-primary hover:bg-primary/25'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
              >
                {lang.flag} {lang.code.toUpperCase()} ({langData.length})
              </button>
            );
          })}
        </div>
      </div>

      {errors[`${field}.${activeLang}`] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[`${field}.${activeLang}`]}
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLang}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-3"
        >
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative group rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 space-y-3">
                  {itemFields.map((f) => {
                    const errKey = `${field}.${activeLang}.${idx}.${f.key}`;
                    return (
                      <div key={f.key}>
                        <Label className="text-xs text-muted-foreground mb-1 block">{f.label}</Label>
                        {f.type === 'textarea' ? (
                          <Textarea
                            value={item[f.key] || ''}
                            onChange={(e) => updateItem(idx, f.key, e.target.value)}
                            placeholder={f.placeholder || f.label}
                            className={`resize-y min-h-[60px] text-sm ${errors[errKey] ? 'border-destructive' : ''}`}
                          />
                        ) : (
                          <Input
                            value={item[f.key] || ''}
                            onChange={(e) => updateItem(idx, f.key, e.target.value)}
                            placeholder={f.placeholder || f.label}
                            className={`text-sm ${errors[errKey] ? 'border-destructive' : ''}`}
                          />
                        )}
                        {errors[errKey] && (
                          <p className="text-xs text-destructive mt-0.5">{errors[errKey]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(idx)}
                  className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full h-11 rounded-xl border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('common.add') + ' (' + LANGUAGES.find((l) => l.code === activeLang)?.label + ')'}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Image Upload Dropzone ─────────────────────────────────────────────────────

function ImageDropzone({ onUpload, uploading, label, className = '' }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onUpload(null, t('destinationForm.media.notAnImage'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onUpload(null, t('destinationForm.media.fileTooLarge'));
      return;
    }
    onUpload(file, null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
        ${dragOver
          ? 'border-primary bg-primary/5'
          : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
        }
        ${uploading ? 'opacity-60 cursor-wait' : ''}
        ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">{t('destinationForm.media.uploading')}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">{label || t('destinationForm.media.dropzone')}</span>
          <span className="text-xs text-muted-foreground">{t('destinationForm.media.dropzoneHint')}</span>
        </div>
      )}
    </div>
  );
}

// ─── Hero Images Editor (multiple hero images) ─────────────────────────────────

function HeroImagesEditor({ urls, setUrls, errors = {} }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleUpload = async (file, clientError) => {
    if (clientError) {
      setUploadError(clientError);
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadDestinationImage(file, 'hero');
      setUrls([...urls, result.url]);
    } catch (err) {
      setUploadError(err?.response?.data?.error || t('destinationForm.media.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    const url = urls[idx];
    const filename = url?.split('/').pop();
    if (filename) {
      deleteDestinationImage(filename).catch(() => {});
    }
    setUrls(urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
        {t('destinationForm.media.heroImages')}
      </Label>

      {urls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {urls.map((url, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group aspect-[16/9] rounded-xl overflow-hidden border border-border/50 shadow-sm"
            >
              <img
                src={url}
                alt={`Hero ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
                {idx + 1}
              </span>
              {errors[`hero_image_urls.${idx}`] && (
                <span className="absolute bottom-2 right-2 text-[10px] text-white bg-destructive px-1.5 py-0.5 rounded">
                  Invalid
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ImageDropzone
        onUpload={handleUpload}
        uploading={uploading}
        label={t('destinationForm.media.addHeroImage')}
      />

      {uploadError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {uploadError}
        </p>
      )}
    </div>
  );
}

// ─── Gallery Upload Manager ────────────────────────────────────────────────────

function GalleryUploadEditor({ urls, setUrls, errors = {} }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleUpload = async (file, clientError) => {
    if (clientError) {
      setUploadError(clientError);
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadDestinationImage(file, 'gallery');
      setUrls([...urls, result.url]);
    } catch (err) {
      setUploadError(err?.response?.data?.error || t('destinationForm.media.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    const url = urls[idx];
    const filename = url?.split('/').pop();
    if (filename) {
      deleteDestinationImage(filename).catch(() => {});
    }
    setUrls(urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
        {t('destinationForm.media.gallery')}
      </Label>

      {urls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {urls.map((url, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group aspect-square rounded-xl overflow-hidden border border-border/50 shadow-sm"
            >
              <img
                src={url}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
                {idx + 1}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      <ImageDropzone
        onUpload={handleUpload}
        uploading={uploading}
        label={t('destinationForm.media.addToGallery')}
      />

      {uploadError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {uploadError}
        </p>
      )}
    </div>
  );
}

// ─── Month Picker ──────────────────────────────────────────────────────────────

function MonthPicker({ selected, setSelected }) {
  const { t } = useTranslation();

  const toggle = (month) => {
    if (selected.includes(month)) {
      setSelected(selected.filter((m) => m !== month));
    } else {
      setSelected([...selected, month].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        {t('destinationForm.media.bestMonths')}
      </Label>
      <div className="grid grid-cols-6 gap-2">
        {MONTH_LABELS.map((label, idx) => {
          const month = idx + 1;
          const isActive = selected.includes(month);
          return (
            <button
              key={month}
              type="button"
              onClick={() => toggle(month)}
              className={`h-10 rounded-lg text-xs font-medium transition-all duration-200 border ${
                isActive
                  ? 'bg-[#384252] text-white border-primary shadow-sm shadow-[#384252]/20'
                  : 'bg-background text-muted-foreground border-border/50 hover:border-primary/30 hover:text-primary'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t('destinationForm.media.selectedMonths', { count: selected.length })}
        </p>
      )}
    </div>
  );
}

// ─── Step Content Renderers ────────────────────────────────────────────────────

function StepIdentity({ form, setForm, errors, isEditing, nextOrder, totalDestinations, selectedHotelId, onHotelChange }) {
  const { t } = useTranslation();
  const autoSlug = () => {
    if (form.name?.fr) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.name.fr) }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Name */}
      <MultiLangInput label={t('destinationForm.fields.name')} field="name" form={form} setForm={setForm} required errors={errors} />

      {/* Hotel Selector */}
      <HotelSelector selectedHotelId={selectedHotelId} onHotelChange={onHotelChange} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-coral-500/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-[10px] text-coral-500/40 uppercase tracking-[0.15em]">{t('destinationForm.contentSettings')}</span>
        </div>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          {t('destinationForm.fields.slug')} <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">/</span>
            <Input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              placeholder={t('destinationForm.fields.slugPlaceholder')}
              className={`pl-7 font-mono text-sm ${errors.slug ? 'border-destructive ring-1 ring-destructive/30' : ''}`}
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="sm" onClick={autoSlug} className="h-9 text-xs">
                  {t('common.auto')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('destinationForm.notices.generateSlug')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {errors.slug && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.slug}</p>}
      </div>

      {/* Subtitle */}
      <MultiLangInput label={t('destinationForm.fields.subtitle')} field="subtitle" form={form} setForm={setForm} errors={errors} />

      {/* Sort order & Published */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">{t('destinationForm.fields.sortOrder')}</Label>
          {isEditing ? (
            <>
              <select
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 1 }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Array.from({ length: totalDestinations || 1 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {t('destinationForm.positionOf', { pos: i + 1, total: totalDestinations || 1 })}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{t('destinationForm.sortOrderEditHint')}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 h-9">
                <div className="inline-flex items-center justify-center px-4 h-9 rounded-md bg-primary/5 border border-primary/20 text-primary font-bold text-lg min-w-[60px] text-center">
                  {nextOrder ?? '...'}
                </div>
                <span className="text-sm text-muted-foreground">
                  {t('destinationForm.sortOrderAutoHint')}
                </span>
              </div>
            </>
          )}
          {errors.sort_order && <p className="text-xs text-destructive">{errors.sort_order}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">{t('destinationForm.fields.publication')}</Label>
          <div className="flex items-center gap-3 h-9 mt-1">
            <Switch
              checked={form.is_published}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, is_published: checked }))}
            />
            <Badge
              variant={form.is_published ? 'default' : 'secondary'}
              className={form.is_published
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }
            >
              {form.is_published ? t('common.published') : t('common.draft')}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepContent({ form, setForm, errors }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <MultiLangInput
        label={t('destinationForm.fields.introRich')}
        field="intro_rich"
        form={form}
        setForm={setForm}
        type="textarea"
        required
        errors={errors}
        helpText={t('destinationForm.fields.introRichHelp')}
      />
      <Separator className="my-2" />
      <MultiLangInput
        label={t('destinationForm.fields.whenToVisit')}
        field="when_to_visit"
        form={form}
        setForm={setForm}
        type="textarea"
        errors={errors}
        helpText={t('destinationForm.fields.whenToVisitHelp')}
      />
    </div>
  );
}

function StepGettingHere({ form, setForm, errors }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-500/10 border border-slate-500/20 p-4">
        <p className="text-sm text-slate-700">
          {t('destinationForm.notices.gettingHereNotice')}
        </p>
      </div>
      <MultiLangArrayEditor
        label={t('destinationForm.fields.gettingHere')}
        field="getting_here"
        form={form}
        setForm={setForm}
        required
        errors={errors}
        itemFields={[
          { key: 'mode', label: t('destinationForm.fields.transportMode'), placeholder: t('destinationForm.fields.transportModePlaceholder') },
          { key: 'description', label: t('destinationForm.fields.transportDescription'), placeholder: t('destinationForm.fields.transportDescriptionPlaceholder'), type: 'textarea' },
        ]}
      />
    </div>
  );
}

function StepActivities({ form, setForm, errors }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
        <p className="text-sm text-amber-700">
          {t('destinationForm.notices.activitiesNotice')}
        </p>
      </div>
      <MultiLangArrayEditor
        label={t('destinationForm.fields.activities')}
        field="what_to_do"
        form={form}
        setForm={setForm}
        required
        errors={errors}
        itemFields={[
          { key: 'title', label: t('destinationForm.fields.activityTitle'), placeholder: t('destinationForm.fields.activityTitlePlaceholder') },
          { key: 'blurb', label: t('destinationForm.fields.activityBlurb'), placeholder: t('destinationForm.fields.activityBlurbPlaceholder'), type: 'textarea' },
        ]}
      />
    </div>
  );
}

function StepTipsFaq({ form, setForm, errors }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      {/* Good to Know */}
      <div className="space-y-6">
        <div className="rounded-xl bg-slate-500/10 border border-slate-500/20 p-4">
          <p className="text-sm text-slate-700">
            {t('destinationForm.notices.tipsNotice')}
          </p>
        </div>
        <MultiLangArrayEditor
          label={t('destinationForm.fields.tips')}
          field="good_to_know"
          form={form}
          setForm={setForm}
          errors={errors}
          itemFields={[
            { key: 'title', label: t('destinationForm.fields.tipTitle'), placeholder: t('destinationForm.fields.tipTitlePlaceholder') },
            { key: 'tip', label: t('destinationForm.fields.tipContent'), placeholder: t('destinationForm.fields.tipContentPlaceholder'), type: 'textarea' },
          ]}
        />
      </div>

      <Separator />

      {/* FAQ */}
      <div className="space-y-6">
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
          <p className="text-sm text-purple-700">
            {t('destinationForm.notices.faqNotice')}
          </p>
        </div>
        <MultiLangArrayEditor
          label={t('destinationForm.fields.faq')}
          field="faq"
          form={form}
          setForm={setForm}
          errors={errors}
          itemFields={[
            { key: 'question', label: t('destinationForm.fields.faqQuestion'), placeholder: t('destinationForm.fields.faqQuestionPlaceholder') },
            { key: 'answer', label: t('destinationForm.fields.faqAnswer'), placeholder: t('destinationForm.fields.faqAnswerPlaceholder'), type: 'textarea' },
          ]}
        />
      </div>
    </div>
  );
}

function StepMedia({ form, setForm, errors }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Hero Images */}
      <HeroImagesEditor
        urls={form.hero_image_urls || []}
        setUrls={(urls) => setForm((p) => ({ ...p, hero_image_urls: urls }))}
        errors={errors}
      />

      <Separator />

      {/* Gallery */}
      <GalleryUploadEditor
        urls={form.gallery_urls || []}
        setUrls={(urls) => setForm((p) => ({ ...p, gallery_urls: urls }))}
        errors={errors}
      />

      <Separator />

      {/* Map embed URL */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {t('destinationForm.fields.mapUrl')}
        </Label>
        <Input
          value={form.map_embed_url || ''}
          onChange={(e) => setForm((p) => ({ ...p, map_embed_url: e.target.value }))}
          placeholder="https://www.google.com/maps/embed?..."
          className={errors.map_embed_url ? 'border-destructive' : ''}
        />
        {errors.map_embed_url && <p className="text-xs text-destructive">{errors.map_embed_url}</p>}
      </div>

      <Separator />

      {/* Best Months */}
      <MonthPicker
        selected={form.best_months || []}
        setSelected={(months) => setForm((p) => ({ ...p, best_months: months }))}
      />
    </div>
  );
}

function StepSEO({ form, setForm, errors }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
        <p className="text-sm text-primary">
          {t('destinationForm.notices.seoNotice')}
        </p>
      </div>

      <MultiLangInput label={t('destinationForm.fields.seoTitle')} field="seo_title" form={form} setForm={setForm} errors={errors}
        helpText={t('destinationForm.fields.seoTitleHelp')}
      />
      <MultiLangInput label={t('destinationForm.fields.seoDescription')} field="seo_description" form={form} setForm={setForm} type="textarea" errors={errors}
        helpText={t('destinationForm.fields.seoDescriptionHelp')}
      />
      <MultiLangInput label={t('destinationForm.fields.seoKeywords')} field="seo_keywords" form={form} setForm={setForm} errors={errors}
        helpText={t('destinationForm.fields.seoKeywordsHelp')}
      />

      <Separator />

      {/* CTA */}
      <MultiLangInput label={t('destinationForm.fields.ctaLabel')} field="cta_label" form={form} setForm={setForm} errors={errors} />

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-muted-foreground" /> {t('destinationForm.fields.ctaUrl')}
        </Label>
        <Input
          value={form.cta_url || ''}
          onChange={(e) => setForm((p) => ({ ...p, cta_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>

      <Separator />

      {/* Related Experiences */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" /> {t('destinationForm.fields.relatedExperiences')}
        </Label>
        <Textarea
          value={(form.related_experiences || []).join('\n')}
          onChange={(e) => setForm((p) => ({ ...p, related_experiences: e.target.value.split('\n').filter((s) => s.trim()) }))}
          placeholder={t('destinationForm.fields.relatedExperiencesPlaceholder')}
          className="min-h-[80px] resize-y text-sm font-mono"
        />
        <p className="text-xs text-muted-foreground">{t('destinationForm.fields.relatedExperiencesHelp')}</p>
      </div>

      {/* Related Collections */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" /> {t('destinationForm.fields.relatedCollections')}
        </Label>
        <Textarea
          value={(form.related_collections || []).join('\n')}
          onChange={(e) => setForm((p) => ({ ...p, related_collections: e.target.value.split('\n').filter((s) => s.trim()) }))}
          placeholder={t('destinationForm.fields.relatedCollectionsPlaceholder')}
          className="min-h-[80px] resize-y text-sm font-mono"
        />
        <p className="text-xs text-muted-foreground">{t('destinationForm.fields.relatedCollectionsHelp')}</p>
      </div>
    </div>
  );
}

// ─── Hotel Selector + Centra Content Panel ────────────────────────────────────

function HotelSelector({ selectedHotelId, onHotelChange }) {
  const { t, lang } = useTranslation();
  const { data: hotels, isLoading } = usePartnerHotels();
  const { data: hotelContent, isLoading: contentLoading } = usePartnerHotelContent(selectedHotelId);

  const amenities = hotelContent?.amenities ?? [];
  const services = hotelContent?.services ?? [];
  const facilities = hotelContent?.facilities ?? [];

  const hotelName = (hotel) => {
    const name = hotel.name || hotel.hotel_name;
    if (name && typeof name === 'object') return name[lang] || name.en || name.fr || hotel.id;
    return name || hotel.id;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-coral-500" />
          {t('destinationForm.fields.associatedProperty')}
        </Label>
        <select
          value={selectedHotelId || ''}
          onChange={(e) => onHotelChange(e.target.value || null)}
          className="flex h-11 w-full rounded-xl border border-border/40 bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coral-500/40"
        >
          <option value="">{isLoading ? t('common.loading') : t('destinationForm.selectProperty')}</option>
          {Array.isArray(hotels) && hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotelName(hotel)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{t('destinationForm.propertyHint')}</p>
      </div>

      {contentLoading && (
        <div className="rounded-xl border border-coral-500/10 bg-coral-50/5 p-6 text-center">
          <Loader2 className="w-5 h-5 text-coral-400 animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-2">{t('common.loading')}</p>
        </div>
      )}

      {!contentLoading && selectedHotelId && (
        <div className="rounded-xl border border-coral-500/20 bg-gradient-to-br from-coral-50/5 to-transparent p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-coral-500" />
            <span className="text-xs font-semibold text-coral-600 uppercase tracking-[0.1em]">
              {t('destinationForm.centraContent')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{t('destinationForm.amenities')}</p>
              {amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((a, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-coral-500/5 border border-coral-500/10 text-xs text-coral-700">
                      {a.name || a.label || a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">{t('destinationForm.none')}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{t('destinationForm.services')}</p>
              {services.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-700">
                      {s.name || s.label || s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">{t('destinationForm.none')}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{t('destinationForm.facilities')}</p>
              {facilities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {facilities.map((f, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-500/5 border border-sky-500/10 text-xs text-sky-700">
                      {f.name || f.label || f}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">{t('destinationForm.none')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step components array ─────────────────────────────────────────────────────

const STEP_COMPONENTS = [StepIdentity, StepContent, StepGettingHere, StepActivities, StepTipsFaq, StepMedia, StepSEO];

// ─── Main Form Component ──────────────────────────────────────────────────────

export default function DestinationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isEditing = !!id && id !== 'new';

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(deepClone(EMPTY_FORM));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(new Set());
  const [originalSortOrder, setOriginalSortOrder] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const formRef = useRef(null);

  // ── Fetch next sort order for new destinations ───────────────────────────
  const { data: orderData } = useQuery({
    queryKey: ['destination-next-order'],
    queryFn: () => getNextDestinationOrder(),
    enabled: !isEditing,
    staleTime: 10000,
  });

  const nextOrder = orderData?.next_order;

  useEffect(() => {
    if (!isEditing && nextOrder) {
      setForm((prev) => ({ ...prev, sort_order: nextOrder }));
    }
  }, [nextOrder, isEditing]);

  // ── Fetch total destinations count for position picker (edit mode) ───────
  const { data: destinationsListData } = useQuery({
    queryKey: ['destinations-count'],
    queryFn: () => listDestinations({ order: 'sort_order.asc' }),
    enabled: isEditing,
    staleTime: 10000,
  });

  const totalDestinations = destinationsListData?.data?.length || 0;

  // ── Load existing ────────────────────────────────────────────────────────
  const { data: existing, isLoading } = useQuery({
    queryKey: ['destination', id],
    queryFn: () => getDestination(id),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existing) {
      const merged = deepClone(EMPTY_FORM);
      Object.keys(merged).forEach((key) => {
        if (existing[key] !== undefined && existing[key] !== null) {
          if (typeof merged[key] === 'object' && !Array.isArray(merged[key]) && merged[key] !== null) {
            merged[key] = ensureObj(existing[key], merged[key]);
          } else if (Array.isArray(merged[key])) {
            merged[key] = ensureArr(existing[key]);
          } else {
            merged[key] = existing[key];
          }
        }
      });
      setForm(merged);
      setOriginalSortOrder(merged.sort_order);
    }
  }, [existing]);

  // ── Save mutation ────────────────────────────────────────────────────────
  const saveMut = useMutation({
    mutationFn: async (data) => {
      const clean = { ...data };
      // Clean arrays
      if (clean.gallery_urls) {
        clean.gallery_urls = clean.gallery_urls.filter((u) => u && u.trim());
      }
      if (clean.hero_image_urls) {
        clean.hero_image_urls = clean.hero_image_urls.filter((u) => u && u.trim());
      }
      if (clean.related_experiences && !clean.related_experiences.length) {
        clean.related_experiences = null;
      }
      if (clean.related_collections && !clean.related_collections.length) {
        clean.related_collections = null;
      }

      if (!isEditing) {
        delete clean.sort_order;
        return insertDestination(clean);
      }

      const positionChanged = originalSortOrder !== null && clean.sort_order !== originalSortOrder;
      const targetPosition = clean.sort_order;
      delete clean.sort_order;

      const result = await updateDestination(id, clean);

      if (positionChanged) {
        await reorderDestination(id, targetPosition);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      queryClient.invalidateQueries({ queryKey: ['destination', id] });
      queryClient.invalidateQueries({ queryKey: ['destinations-count'] });
      queryClient.invalidateQueries({ queryKey: ['destination-next-order'] });
      toast({
        title: isEditing ? t('destinationForm.saved') : t('destinationForm.created'),
        description: isEditing
          ? t('destinationForm.savedDesc')
          : t('destinationForm.createdDesc'),
      });
      navigate('/destinations');
    },
    onError: (err) => {
      toast({
        title: t('common.error'),
        description: err?.response?.data?.error || err.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  // ── Step navigation ──────────────────────────────────────────────────────
  const goNext = () => {
    const stepErrors = validateStep(currentStep, form, t);
    setErrors(stepErrors);
    setTouched((prev) => new Set([...prev, currentStep]));

    if (Object.keys(stepErrors).length > 0) {
      toast({ title: t('destinationForm.invalidFields'), description: t('destinationForm.invalidFieldsDesc'), variant: 'destructive' });
      return;
    }
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const goToStep = (stepIdx) => {
    if (stepIdx > currentStep) {
      const stepErrors = validateStep(currentStep, form, t);
      setErrors(stepErrors);
      setTouched((prev) => new Set([...prev, currentStep]));
      if (Object.keys(stepErrors).length > 0) {
        toast({ title: t('destinationForm.invalidFields'), description: t('destinationForm.correctCurrentStep'), variant: 'destructive' });
        return;
      }
    }
    setCurrentStep(stepIdx);
  };

  const handleSave = () => {
    let allErrors = {};
    for (let i = 0; i < STEPS.length; i++) {
      const stepErrors = validateStep(i, form, t);
      allErrors = { ...allErrors, ...stepErrors };
    }
    setErrors(allErrors);
    setTouched(new Set(STEPS.map((_, i) => i)));

    if (Object.keys(allErrors).length > 0) {
      for (let i = 0; i < STEPS.length; i++) {
        const stepErr = validateStep(i, form, t);
        if (Object.keys(stepErr).length > 0) {
          setCurrentStep(i);
          break;
        }
      }
      toast({ title: t('destinationForm.formIncomplete'), description: t('destinationForm.formIncompleteDesc'), variant: 'destructive' });
      return;
    }

    saveMut.mutate(form);
  };

  // ── Step completeness ────────────────────────────────────────────────────
  const getStepStatus = (stepIdx) => {
    if (!touched.has(stepIdx) && stepIdx !== currentStep) return 'pending';
    const stepErrors = validateStep(stepIdx, form, t);
    return Object.keys(stepErrors).length === 0 ? 'complete' : 'error';
  };

  const StepComponent = STEP_COMPONENTS[currentStep];

  // ── Render ───────────────────────────────────────────────────────────────
  if (isEditing && isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-8" ref={formRef}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/destinations')}
            className="h-10 w-10 rounded-xl hover:bg-coral-500/10 text-coral-500/60 hover:text-coral-500 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight flex items-center gap-2">
              <MapPin className="w-6 h-6 text-coral-500" />
              {isEditing ? t('destinationForm.editTitle') : t('destinationForm.newTitle')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('destinationForm.stepOf', { current: currentStep + 1, total: STEPS.length })} — {t(STEPS[currentStep].descKey)}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMut.isPending}
          className="bg-coral-500 hover:bg-coral-600 text-white gap-2 h-11 px-6 rounded-xl shadow-lg shadow-coral-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing ? t('destinationForm.save') : t('destinationForm.create')}
        </Button>
      </div>

      {/* ── Step indicator ──────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute top-[22px] left-0 right-0 h-0.5 bg-border/40 z-0 hidden lg:block" />
        <motion.div
          className="absolute top-[22px] left-0 h-0.5 bg-coral-500 z-[1] hidden lg:block"
          initial={false}
          animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        <div className="grid grid-cols-7 gap-2 relative z-10">
          {STEPS.map((step, idx) => {
            const status = getStepStatus(idx);
            const isActive = idx === currentStep;
            const StepIcon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(idx)}
                className={`group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-coral-500/5 border-2 border-coral-500/30 shadow-sm shadow-coral-500/10'
                    : 'bg-card border border-border/30 hover:border-coral-500/20 hover:shadow-sm'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-coral-500 text-white shadow-md shadow-coral-500/30'
                    : status === 'complete'
                    ? 'bg-coral-500 text-white'
                    : status === 'error'
                    ? 'bg-destructive text-white'
                    : 'bg-muted text-muted-foreground group-hover:bg-coral-500/10 group-hover:text-coral-500'
                }`}>
                  {status === 'complete' && !isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-[11px] font-display font-medium leading-tight text-center transition-colors ${
                  isActive ? 'text-coral-600 font-semibold' : 'text-muted-foreground'
                }`}>
                  {t(step.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step content ────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-coral-500/10 shadow-sm overflow-hidden">
        <div className="p-2 bg-gradient-to-r from-coral-50/5 to-transparent border-b border-coral-500/10">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-8 h-8 rounded-lg bg-coral-500/10 flex items-center justify-center">
              {React.createElement(STEPS[currentStep].icon, { className: 'w-4 h-4 text-coral-500' })}
            </div>
            <span className="text-sm font-display font-semibold text-foreground">{t(STEPS[currentStep].labelKey)}</span>
            <span className="text-xs text-muted-foreground ml-1">— {t(STEPS[currentStep].descKey)}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="p-8"
          >
            <StepComponent
              form={form}
              setForm={setForm}
              errors={errors}
              {...(currentStep === 0 ? { isEditing, nextOrder, totalDestinations, selectedHotelId, onHotelChange: setSelectedHotelId } : {})}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation footer ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 0}
          className="gap-2 h-11 rounded-xl px-6 border-coral-500/20 text-coral-600 hover:text-coral-700 hover:bg-coral-50/5 hover:border-coral-500/30"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.previous')}
        </Button>

        <div className="flex items-center gap-2">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToStep(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-6 bg-coral-500'
                  : getStepStatus(idx) === 'complete'
                  ? 'bg-coral-500'
                  : getStepStatus(idx) === 'error'
                  ? 'bg-destructive'
                  : 'bg-border hover:bg-coral-500/30'
              }`}
            />
          ))}
        </div>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={goNext}
            className="bg-coral-500 hover:bg-coral-600 text-white gap-2 h-11 rounded-xl px-6 shadow-md shadow-coral-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('common.next')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saveMut.isPending}
            className="bg-coral-500 hover:bg-coral-600 text-white gap-2 h-11 rounded-xl px-6 shadow-md shadow-coral-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEditing ? t('destinationForm.save') : t('destinationForm.createDestination')}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
