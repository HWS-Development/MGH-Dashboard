import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, MapPin, Phone, Mail,
  Globe, Star, Users, Calendar, Award, Shield,
  ExternalLink, Maximize2, Minimize2,
  Building2, Sparkles, CheckCircle2, Navigation, Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartnerHotelContent } from '@/lib/partnerHotelsApi';
import { useTranslation } from '@/i18n';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } },
};
const scaleItem = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const propertyId = id;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  const {
    data: propertyContent,
    isLoading: loadingContent,
  } = usePartnerHotelContent(propertyId);

  const property = propertyContent || {};

  const tr = (obj) => {
    if (!obj || typeof obj !== 'object') return String(obj || '');
    return obj[lang] || obj.fr || obj.en || '';
  };

  const images = useMemo(() => {
    const imgs = property.imageUrls || property.image_urls || [];
    return imgs.length > 0 ? imgs : FALLBACK_IMAGES;
  }, [property.imageUrls, property.image_urls]);

  const totalSlides = images.length;

  const goToSlide = useCallback((idx) => {
    setCurrentSlide(((idx % totalSlides) + totalSlides) % totalSlides);
  }, [totalSlides]);

  const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [goToSlide, currentSlide]);
  const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [goToSlide, currentSlide]);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setInterval(nextSlide, 4500);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, totalSlides]);

  const gps = useMemo(() => {
    const lat = property.latitude;
    const lng = property.longitude;
    return lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
  }, [property.latitude, property.longitude]);

  const googleMapsUrl = gps
    ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
    : null;

  const amenities = property?.amenities ?? [];
  const services = property?.services ?? [];
  const facilities = property?.facilities ?? [];

  const name = tr(property.name) || '';
  const description = tr(property.description) || '';
  const cityName = property.city || property.cityId || property.city_id || '';
  const typeName = property.propertyType || property.propertyTypeId || property.property_type || property.property_type_id || '';
  const rating = property.ratingAvg || property.rating_avg;
  const reviews = property.reviewsCount || property.reviews_count;
  const address = tr(property.address) || '';

  const contactInfoItems = [
    ...((property.phone || property.reservation_phone)
      ? [{ icon: Phone, label: 'Téléphone', value: property.phone || property.reservation_phone, href: `tel:${(property.phone || property.reservation_phone).replace(/\s/g, '')}` }]
      : []),
    ...((property.email || property.reservation_email)
      ? [{ icon: Mail, label: 'Email', value: property.email || property.reservation_email, href: `mailto:${property.email || property.reservation_email}` }]
      : []),
    ...(property.website
      ? [{ icon: Globe, label: 'Site web', value: property.website, href: property.website }]
      : []),
    ...(property.simple_booking_link
      ? [{ icon: CheckCircle2, label: 'Simple Booking', value: 'Activé' }]
      : []),
  ];

  const isLoading = loadingContent && !propertyContent;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
      {/* ── Back nav ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40"
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/properties')}
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline">Retour aux propriétés</span>
          </button>
          <div className="flex items-center gap-3">
            {statusCfg && (
              <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border ${statusCfg.class}`}>
                {statusCfg.label}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-mono">#{property?.hotelId || property?.id || propertyId}</span>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 space-y-8">
          <Skeleton className="h-[60vh] w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════
             CINEMATIC HERO
          ══════════════════════════════════════════════════════════════ */}
          <section
            className="relative h-[60vh] md:h-[75vh] overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent z-10" />
                <img
                  src={images[currentSlide]}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = FALLBACK_IMAGES[currentSlide % FALLBACK_IMAGES.length]; }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Hero nav arrows */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Hero bottom: title overlay + progress */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="max-w-[1440px] mx-auto"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {typeName && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 border border-white/20">
                      {typeName}
                    </span>
                  )}
                  {cityName && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-coral-500/20 backdrop-blur-sm text-coral-300 border border-coral-500/30 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {cityName}
                    </span>
                  )}
                  {rating && (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-300" /> {rating}
                      {reviews && <>({reviews})</>}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight leading-tight max-w-3xl">
                  {name || 'Propriété'}
                </h1>
                {address && (
                  <p className="text-white/60 text-sm md:text-base mt-2 max-w-xl flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {address}
                  </p>
                )}
              </motion.div>

              {/* Progress line */}
              {totalSlides > 1 && (
                <div className="max-w-[1440px] mx-auto mt-6 flex items-center gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      className="relative flex-1 h-0.5 group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full" />
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-white rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: idx <= currentSlide ? '100%' : '0%' }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                      <div
                        className={`absolute -top-1.5 left-0 right-0 h-3 transition-all duration-300 ${
                          idx === currentSlide ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[10px] text-white/40 font-mono ml-2 flex-shrink-0">
                    {String(currentSlide + 1).padStart(2, '0')}/{String(totalSlides).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
             CONTENT
          ══════════════════════════════════════════════════════════════ */}
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-14 space-y-12">

            {/* ── Description ───────────────────────────────────────── */}
            {description && (
              <motion.div variants={item} className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Quote className="w-4 h-4 text-coral-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coral-400">À propos</span>
                </div>
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed font-display">
                  {description}
                </p>
              </motion.div>
            )}

            {/* ── Key stats bar ────────────────────────────────────── */}
            <motion.div variants={item}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-border/50 bg-border/20">
                {[
                  rating && { icon: Star, label: 'Note moyenne', value: rating, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                  typeName && { icon: Building2, label: 'Type', value: typeName, color: 'text-sky-500', bg: 'bg-sky-500/5' },
                  cityName && { icon: MapPin, label: 'Ville', value: cityName, color: 'text-coral-500', bg: 'bg-coral-500/5' },
                  { icon: Users, label: 'Photos', value: images.length, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                ].filter(Boolean).map((stat) => (
                  <div key={stat.label} className={`${stat.bg} p-5 md:p-6 text-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5`} />
                    <div className="text-lg md:text-xl font-display font-bold text-foreground">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Contact & Info Grid ──────────────────────────────── */}
            {contactInfoItems.length > 0 && (
              <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contactInfoItems.map((info) => (
                  <div key={info.label} className="group relative rounded-xl border border-border/40 bg-card p-4 hover:shadow-md hover:border-coral-200/40 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-coral-100 transition-colors">
                        <info.icon className={`w-4 h-4 ${info.color || 'text-muted-foreground'} group-hover:text-coral-600 transition-colors`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-semibold">{info.label}</p>
                        {info.href ? (
                          <a href={info.href} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground hover:text-coral-600 truncate block transition-colors mt-0.5">
                            {info.value}
                          </a>
                        ) : (
                          <p className={`text-sm font-medium truncate mt-0.5 ${info.color || 'text-foreground'}`}>{info.value}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Map ──────────────────────────────────────────────── */}
            {gps && (
              <motion.div variants={item}>
                <div className="flex items-center gap-2 mb-4">
                  <Navigation className="w-4 h-4 text-coral-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coral-400">Localisation</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-lg group">
                  <div className="aspect-[21/9] bg-muted">
                    <iframe
                      title="Map"
                      src={`https://www.google.com/maps?q=${gps.lat},${gps.lng}&z=15&output=embed`}
                      className="w-full h-full"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500" />
                  <div className="absolute bottom-4 right-4 z-10">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-md text-sm font-semibold text-foreground shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      <Navigation className="w-4 h-4 text-coral-500" />
                      Ouvrir dans Google Maps
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Centra Content: Amenities / Services / Facilities ── */}
            {(amenities.length > 0 || services.length > 0 || facilities.length > 0) && (
              <motion.div variants={item}>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-4 h-4 text-coral-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coral-400">
                    Centra — Équipements & services
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Équipements', items: amenities, color: 'from-coral-500/10 to-coral-500/5 border-coral-500/20', dot: 'bg-coral-500' },
                    { title: 'Services', items: services, color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20', dot: 'bg-emerald-500' },
                    { title: 'Installations', items: facilities, color: 'from-sky-500/10 to-sky-500/5 border-sky-500/20', dot: 'bg-sky-500' },
                  ].map((section) => (
                    <div key={section.title} className={`rounded-xl bg-gradient-to-br ${section.color} border p-5`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${section.dot}`} />
                        <span className="text-xs font-semibold text-foreground uppercase tracking-[0.1em]">{section.title}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">({section.items.length})</span>
                      </div>
                      {section.items.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {section.items.map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-background/60 text-xs text-foreground/80 border border-border/30"
                            >
                              {item.name || item.label || item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Aucun</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Image gallery ────────────────────────────────────── */}
            {images.length > 1 && (
              <motion.div variants={item}>
                <div className="flex items-center gap-2 mb-4">
                  <Maximize2 className="w-4 h-4 text-coral-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coral-400">Galerie</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((url, idx) => (
                    <motion.button
                      key={idx}
                      variants={scaleItem}
                      onClick={() => setExpandedImage(url)}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/30 group cursor-pointer"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Maximize2 className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── Lightbox ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {expandedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedImage(null)}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 md:p-10 cursor-pointer"
              >
                <button
                  onClick={() => setExpandedImage(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <motion.img
                  key={expandedImage}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  src={expandedImage}
                  alt=""
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
