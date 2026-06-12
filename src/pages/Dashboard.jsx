import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Camera,
  CircleDollarSign,
  MapPinned,
  Phone,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePartnerHotelsStats } from '@/lib/partnerHotelsApi';

const ACCENT_COLORS = {
  gold: 'hsl(38 92% 55%)',
  emerald: 'hsl(160 84% 42%)',
  sapphire: 'hsl(217 91% 60%)',
  violet: 'hsl(262 83% 67%)',
  rose: 'hsl(346 84% 61%)',
  slate: 'hsl(215 20% 65%)',
  amber: 'hsl(32 95% 52%)',
};

const DONUT_COLORS = [
  ACCENT_COLORS.gold,
  ACCENT_COLORS.emerald,
  ACCENT_COLORS.sapphire,
  ACCENT_COLORS.violet,
  ACCENT_COLORS.rose,
];

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.045, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

function parseMaybeJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function isPresent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.filter(Boolean).length > 0;
  if (typeof value === 'object') return Object.values(value).some(isPresent);
  return Boolean(value);
}

function asArray(value) {
  const parsed = parseMaybeJson(value, []);
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
}

function localized(value) {
  const parsed = parseMaybeJson(value, value);
  if (!isPresent(parsed)) return '';
  if (typeof parsed === 'string') return parsed.trim();
  if (typeof parsed === 'object') {
    return parsed.fr || parsed.en || parsed.ar || Object.values(parsed).find((v) => typeof v === 'string' && v.trim()) || '';
  }
  return String(parsed);
}

function pick(hotel, keys) {
  for (const key of keys) {
    if (isPresent(hotel?.[key])) return hotel[key];
  }
  return '';
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR').format(value || 0);
}

function useCountUp(end, duration = 850, precision = 0) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);

  useEffect(() => {
    const target = Number(end);
    if (!Number.isFinite(target)) return;

    const start = prevEnd.current;
    prevEnd.current = target;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [end, duration]);

  return precision > 0 ? count.toFixed(precision) : Math.round(count);
}

function normalizeHotel(hotel) {
  const images = asArray(hotel.image_urls || hotel.imageUrls);
  const nameValue = localized(hotel.name || hotel.title);
  const descriptionValue = localized(hotel.description);
  const phone = pick(hotel, ['phone', 'phone_number', 'phoneNumber', 'reservation_phone', 'reservationPhone']);
  const email = pick(hotel, ['email', 'reservation_email', 'reservationEmail']);
  const beLink = pick(hotel, ['beLink', 'be_link', 'be_link_url']);
  const website = pick(hotel, ['website', 'website_url', 'websiteUrl']);
  const city = localized(pick(hotel, ['city', 'city_name', 'cityName', 'city_id', 'cityId'])) || 'Non renseignée';
  const type = localized(pick(hotel, ['property_type', 'propertyType', 'property_type_id', 'propertyTypeId', 'type'])) || 'Non renseigné';
  const lat = pick(hotel, ['latitude', 'lat']);
  const lng = pick(hotel, ['longitude', 'lng']);
  const servicesCount =
    asArray(hotel.amenities).length +
    asArray(hotel.amenityIds).length +
    asArray(hotel.amenity_ids).length +
    asArray(hotel.services).length +
    asArray(hotel.serviceIds).length +
    asArray(hotel.service_ids).length +
    asArray(hotel.facilities).length +
    asArray(hotel.bookingConditionIds).length +
    asArray(hotel.booking_condition_ids).length;
  const hotelId = hotel.hotelId || hotel.hotel_id || hotel.id;
  const contactReady = isPresent(phone) || isPresent(email);
  const rating = toNumber(hotel.ratingAvg || hotel.rating_avg);
  const reviews = toNumber(hotel.reviewsCount || hotel.reviews_count) || 0;

  const checks = [
    { label: 'Nom', ok: isPresent(nameValue) },
    { label: 'Description', ok: isPresent(descriptionValue) },
    { label: 'Ville', ok: city !== 'Non renseignée' },
    { label: 'Type', ok: type !== 'Non renseigné' },
    { label: 'Photos', ok: images.length > 0 },
    { label: 'Galerie riche', ok: images.length >= 5 },
    { label: 'Contact', ok: contactReady },
    { label: 'Champ beLink', ok: isPresent(beLink) },
    { label: 'Géolocalisation', ok: isPresent(lat) && isPresent(lng) },
    { label: 'Services', ok: servicesCount > 0 || isPresent(website) },
  ];

  const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);

  return {
    raw: hotel,
    id: hotel.id,
    hotelId,
    name: nameValue || hotelId || 'Riad sans nom',
    city,
    type,
    rating,
    reviews,
    images,
    score,
    missing: checks.filter((check) => !check.ok).map((check) => check.label),
    hasName: isPresent(nameValue),
    hasDescription: isPresent(descriptionValue),
    hasCity: city !== 'Non renseignée',
    hasType: type !== 'Non renseigné',
    hasPhotos: images.length > 0,
    hasRichPhotos: images.length >= 5,
    hasContact: contactReady,
    hasBeLink: isPresent(beLink),
    hasGeo: isPresent(lat) && isPresent(lng),
    hasServices: servicesCount > 0 || isPresent(website),
  };
}

function buildGroupStats(hotels, key) {
  const map = new Map();

  hotels.forEach((hotel) => {
    const label = hotel[key] || 'Non renseigné';
    const current = map.get(label) || { label, count: 0, score: 0, booking: 0, media: 0 };
    current.count += 1;
    current.score += hotel.score;
    current.booking += hotel.hasBeLink ? 1 : 0;
    current.media += hotel.hasRichPhotos ? 1 : 0;
    map.set(label, current);
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      avgScore: Math.round(item.score / item.count),
      bookingRate: percent(item.booking, item.count),
      mediaRate: percent(item.media, item.count),
    }))
    .sort((a, b) => b.count - a.count || b.avgScore - a.avgScore);
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-xs text-foreground shadow-xl backdrop-blur">
      <div className="font-semibold">{label || item.name}</div>
      <div className="mt-1 text-muted-foreground">{item.name}: <span className="font-semibold text-foreground">{item.value}</span></div>
    </div>
  );
}

function SkeletonPanel({ className = '' }) {
  return <div className={`animate-pulse rounded-3xl bg-muted ${className}`} />;
}

function KpiCard({ title, value, suffix = '', sub, icon: Icon, color, index, loading }) {
  const displayValue = useCountUp(value, 850);

  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible" className="group">
      <div className="relative h-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/35 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/45 hover:shadow-xl hover:shadow-amber-500/10">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-15 blur-2xl" style={{ background: color }} />
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

        <div className="flex items-start justify-between gap-4">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-inner">
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="rounded-full border border-border/70 bg-muted/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            KPI
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="h-9 w-20 rounded-lg bg-muted animate-pulse" />
          ) : (
            <div className="font-display text-3xl font-bold tracking-tight text-foreground">
              {formatNumber(displayValue)}{suffix}
            </div>
          )}
          <div className="mt-1 text-sm font-semibold text-foreground/85">{title}</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {sub}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReadingGuide() {
  const items = [
    {
      icon: BarChart3,
      title: 'Comment lire les pourcentages',
      text: 'Un pourcentage indique la part des fiches concernées sur le total des riads. Exemple : 80% = 8 fiches sur 10.',
      color: ACCENT_COLORS.sapphire,
    },
    {
      icon: ShieldCheck,
      title: 'Score de complétude',
      text: 'Chaque fiche est notée selon 10 informations attendues : nom, description, ville, type, photos, contact, lien réservation, GPS et services.',
      color: ACCENT_COLORS.emerald,
    },
    {
      icon: CircleDollarSign,
      title: 'Lien de réservation (beLink)',
      text: 'Indique si le champ beLink est rempli dans MGH, c\'est-à-dire si un lien de réservation a été configuré pour ce riad.',
      color: ACCENT_COLORS.gold,
    },
  ];

  return (
    <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible" className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Guide de lecture des statistiques</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chaque bloc explique une information simple et vérifiable depuis les données MGH.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-border/45 bg-muted/25 p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
              <item.icon className="h-5 w-5" style={{ color: item.color }} />
            </div>
            <div className="text-sm font-semibold text-foreground">{item.title}</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DonutCard({ title, subtitle, data, centerValue, centerLabel, index }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const safeData = total > 0 ? data : [{ name: 'Aucune donnée', value: 1, color: ACCENT_COLORS.slate }];

  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible" className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-amber-500/10 p-2 text-amber-600">
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>

      <div className="relative h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} />
            <Pie data={safeData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4} stroke="none">
              {safeData.map((entry, idx) => (
                <Cell key={entry.name} fill={entry.color || DONUT_COLORS[idx % DONUT_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-foreground">{centerValue}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{centerLabel}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 pt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-2xl bg-muted/45 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              <span className="truncate text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-semibold text-foreground">{formatNumber(item.value)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function BarPanel({ title, subtitle, data, dataKey = 'value', index }) {
  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible" className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-violet-500/10 p-2 text-violet-600">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={0} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey={dataKey} radius={[10, 10, 4, 4]} barSize={34}>
              {data.map((entry, idx) => (
                <Cell key={entry.name} fill={entry.color || DONUT_COLORS[idx % DONUT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: rawHotels = [], isLoading } = usePartnerHotelsStats();

  const hotels = useMemo(() => rawHotels.map(normalizeHotel), [rawHotels]);
  const total = hotels.length;
  const avgScore = total ? Math.round(hotels.reduce((sum, hotel) => sum + hotel.score, 0) / total) : 0;
  const beReady = hotels.filter((hotel) => hotel.hasBeLink).length;
  const directContact = hotels.filter((hotel) => hotel.hasContact).length;
  const richMedia = hotels.filter((hotel) => hotel.hasRichPhotos).length;
  const geoReady = hotels.filter((hotel) => hotel.hasGeo).length;
  const averageImages = total ? (hotels.reduce((sum, hotel) => sum + hotel.images.length, 0) / total).toFixed(1) : '0.0';

  const fieldCoverage = [
    { name: 'Nom', value: percent(hotels.filter((h) => h.hasName).length, total), color: ACCENT_COLORS.gold },
    { name: 'Desc.', value: percent(hotels.filter((h) => h.hasDescription).length, total), color: ACCENT_COLORS.emerald },
    { name: 'Ville', value: percent(hotels.filter((h) => h.hasCity).length, total), color: ACCENT_COLORS.sapphire },
    { name: 'Type', value: percent(hotels.filter((h) => h.hasType).length, total), color: ACCENT_COLORS.violet },
    { name: 'Photos', value: percent(hotels.filter((h) => h.hasPhotos).length, total), color: ACCENT_COLORS.rose },
    { name: 'Contact', value: percent(directContact, total), color: ACCENT_COLORS.amber },
    { name: 'Champ beLink', value: percent(beReady, total), color: ACCENT_COLORS.gold },
    { name: 'Geo', value: percent(geoReady, total), color: ACCENT_COLORS.emerald },
  ];

  const beLinkData = [
    { name: 'beLink renseigné', value: beReady, color: ACCENT_COLORS.gold },
    { name: 'Contact présent, beLink manquant', value: hotels.filter((h) => !h.hasBeLink && h.hasContact).length, color: ACCENT_COLORS.sapphire },
    { name: 'Contact et beLink manquants', value: hotels.filter((h) => !h.hasBeLink && !h.hasContact).length, color: ACCENT_COLORS.rose },
  ];

  const mediaData = [
    { name: '5 photos ou plus', value: richMedia, color: ACCENT_COLORS.emerald },
    { name: '1 à 4 photos', value: hotels.filter((h) => h.hasPhotos && !h.hasRichPhotos).length, color: ACCENT_COLORS.gold },
    { name: 'Aucune photo', value: hotels.filter((h) => !h.hasPhotos).length, color: ACCENT_COLORS.rose },
  ];

  const scoreHistogram = [
    { name: '0-39', value: hotels.filter((h) => h.score < 40).length, color: ACCENT_COLORS.rose },
    { name: '40-59', value: hotels.filter((h) => h.score >= 40 && h.score < 60).length, color: ACCENT_COLORS.amber },
    { name: '60-79', value: hotels.filter((h) => h.score >= 60 && h.score < 80).length, color: ACCENT_COLORS.sapphire },
    { name: '80-100', value: hotels.filter((h) => h.score >= 80).length, color: ACCENT_COLORS.emerald },
  ];

  const cityStats = buildGroupStats(hotels, 'city');
  const typeStats = buildGroupStats(hotels, 'type');
  const priorityHotels = [...hotels].sort((a, b) => a.score - b.score || a.name.localeCompare(b.name)).slice(0, 7);
  const excellentHotels = hotels.filter((hotel) => hotel.score >= 80).length;

  const kpis = [
    { title: 'Nombre de riads', value: total, sub: 'Total des fiches analysées', icon: Building2, color: ACCENT_COLORS.gold },
    { title: 'Complétude moyenne', value: avgScore, suffix: '%', sub: `Score moyen sur 10 informations (${excellentHotels} fiches ≥ 80%)`, icon: ShieldCheck, color: ACCENT_COLORS.emerald },
    { title: 'Champ beLink renseigné', value: percent(beReady, total), suffix: '%', sub: `${beReady} fiches ont beLink rempli dans MGH`, icon: CircleDollarSign, color: ACCENT_COLORS.sapphire },
    { title: 'Contact disponible', value: percent(directContact, total), suffix: '%', sub: `${directContact} fiches avec email ou téléphone`, icon: Phone, color: ACCENT_COLORS.violet },
    { title: 'Photos suffisantes', value: percent(richMedia, total), suffix: '%', sub: `${averageImages} photos en moyenne; objectif: 5+`, icon: Camera, color: ACCENT_COLORS.rose },
    { title: 'Position GPS renseignée', value: percent(geoReady, total), suffix: '%', sub: `${geoReady} fiches avec latitude + longitude`, icon: MapPinned, color: ACCENT_COLORS.amber },
  ];

  return (
    <motion.div className="space-y-8 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi, index) => (
          <KpiCard key={kpi.title} {...kpi} index={index} loading={isLoading} />
        ))}
      </div>

      <ReadingGuide />

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <SkeletonPanel className="h-[420px]" />
          <SkeletonPanel className="h-[420px]" />
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-3">
            <DonutCard
              title="Champ beLink dans MGH"
              subtitle="Combien de fiches ont le champ beLink rempli. Ce n'est pas un bouton pour réserver."
              data={beLinkData}
              centerValue={`${percent(beReady, total)}%`}
              centerLabel="avec lien"
              index={0}
            />
            <DonutCard
              title="Photos des riads"
              subtitle="Une fiche est considérée bien illustrée à partir de 5 photos."
              data={mediaData}
              centerValue={`${percent(richMedia, total)}%`}
              centerLabel="5+ photos"
              index={1}
            />
            <BarPanel
              title="Niveau de complétude des fiches"
              subtitle="Nombre de fiches dans chaque tranche de score. Plus le score est haut, plus la fiche est complète."
              data={scoreHistogram}
              index={2}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <BarPanel
              title="Informations présentes"
              subtitle="Pour chaque champ, le pourcentage indique combien de fiches ont cette information renseignée."
              data={fieldCoverage}
              index={3}
            />

            <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Types de propriétés</h3>
                   <p className="mt-1 text-sm text-muted-foreground">Nombre de fiches par type de propriété.</p>
                </div>
                <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-600">
                  <BadgeCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                {typeStats.slice(0, 7).map((item, index) => (
                  <div key={item.label} className="rounded-2xl border border-border/45 bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0 font-medium text-foreground truncate">{item.label}</div>
                      <div className="font-semibold text-muted-foreground">{item.count}</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-background overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${percent(item.count, total)}%`, background: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Comparaison par ville</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Par ville : nombre de riads, complétude moyenne et part des fiches avec beLink rempli.</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-600">
                  <MapPinned className="h-5 w-5" />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/50">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Ville</th>
                      <th className="px-4 py-3 text-right">Riads</th>
                      <th className="px-4 py-3 text-right">Complétude</th>
                      <th className="hidden px-4 py-3 text-right sm:table-cell">beLink %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {cityStats.slice(0, 8).map((item) => (
                      <tr key={item.label} className="transition-colors hover:bg-muted/35">
                        <td className="px-4 py-3 font-medium text-foreground">{item.label}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.count}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">{item.avgScore}%</td>
                        <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">{item.bookingRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible" className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Fiches à compléter en priorité</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Les fiches avec le plus d'informations manquantes apparaissent en premier.</p>
                </div>
                <div className="rounded-2xl bg-rose-500/10 p-2 text-rose-600">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                {priorityHotels.map((hotel) => (
                  <button
                    key={hotel.id || hotel.hotelId || hotel.name}
                    type="button"
                    onClick={() => hotel.hotelId && navigate(`/properties/${hotel.hotelId}/details`)}
                    className="group w-full rounded-2xl border border-border/50 bg-muted/25 p-4 text-left transition-all hover:border-amber-300/50 hover:bg-amber-500/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-foreground">{hotel.name}</span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{hotel.hotelId || hotel.id}</div>
                      </div>
                      <div className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground">{hotel.score}%</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {hotel.missing.slice(0, 4).map((item) => (
                        <span key={item} className="rounded-full bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-600">{item}</span>
                      ))}
                      {hotel.missing.length === 0 && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600">Complet</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
