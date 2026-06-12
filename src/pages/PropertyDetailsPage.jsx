import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, MapPin, Phone, Mail,
  Globe, Star, Users,
  ExternalLink, Maximize2, X,
  Building2, Sparkles, CheckCircle2, Navigation, Quote
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartnerHotelContent } from '@/lib/partnerHotelsApi';
import { useTranslation } from '@/i18n';

function FaWhatsapp({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 448 512" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.8 32 2.4 131.4 2.4 253.5c0 39.1 10.2 77.3 29.6 111L0 480l118.3-31.1c32.4 17.7 68.9 27 105.6 27h.1c122.1 0 221.5-99.4 221.5-221.5 0-59.3-23.1-115-64.6-157.3zM224 438.7h-.1c-32.7 0-64.8-8.8-92.8-25.4l-6.7-4-70.2 18.4 18.7-68.4-4.4-7C50.3 323.5 40.7 289 40.7 253.5c0-101 82.2-183.2 183.3-183.2 48.9 0 94.9 19.1 129.5 53.7 34.6 34.7 53.6 80.7 53.6 129.6 0 101-82.2 183.1-183.1 183.1zm100.4-137.3c-5.5-2.8-32.6-16.1-37.7-17.9-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 17.9-17.6 21.6c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.6-13.3 37.2-26.2 4.6-12.9 4.6-24 3.2-26.2-1.3-2.5-5-3.9-10.5-6.9z" />
    </svg>
  );
}

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

  const whatsappNumber = property.whatsappNumber || '';
  const beLink = property.beLink || '';
  const extraInfoText = property.extraInfo ? tr(property.extraInfo) : '';

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
    ...(whatsappNumber
      ? [{ icon: FaWhatsapp, label: 'WhatsApp', value: whatsappNumber, href: `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` }]
      : []),
    ...(beLink
      ? [{ icon: ExternalLink, label: 'Booking.com Extranet', value: 'Accéder', href: beLink }]
      : []),
    ...(property.simple_booking_link
      ? [{ icon: CheckCircle2, label: 'Simple Booking', value: 'Activé' }]
      : []),
    ...(extraInfoText
      ? [{ icon: Sparkles, label: 'Info complémentaire', value: extraInfoText }]
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

            {/* ── Book Now CTA ──────────────────────────────────────── */}
            {(beLink || property.simple_booking_link || property.website) && (
              <motion.div variants={item} className="text-center">
                <a
                  href={beLink || property.simple_booking_link || property.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-coral-500 text-white font-semibold text-sm uppercase tracking-[0.1em] hover:bg-coral-600 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Réserver
                  <ExternalLink className="w-4 h-4" />
                </a>
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

          {/* ── Full-screen Lightbox ─────────────────────────────────── */}
          <AnimatePresence>
            {expandedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setExpandedImage(null)}
                className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer"
              >
                <button
                  onClick={() => setExpandedImage(null)}
                  className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-8 h-8" />
                </button>
                <motion.img
                  key={expandedImage}
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  src={expandedImage}
                  alt=""
                  className="w-full h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Floating WhatsApp button ──────────────────────────── */}
          {whatsappNumber && (
            <motion.a
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all duration-300"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="w-7 h-7" />
            </motion.a>
          )}
        </>
      )}
    </motion.div>
  );
}
