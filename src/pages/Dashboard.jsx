import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Mail, BookOpen, BarChart3, CheckCircle, TrendingUp, Users, Sparkles } from 'lucide-react';
import { listContacts } from '@/lib/api';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { useTranslation } from '@/i18n';

const ACCENT_COLORS = {
  brand: 'hsl(239 84% 67%)',
  green: 'hsl(160 84% 45%)',
  amber: 'hsl(35 92% 55%)',
  blue: 'hsl(217 91% 60%)',
  purple: 'hsl(280 87% 65%)',
  rose: 'hsl(0 84% 60%)',
};

function useCountUp(end, duration = 1000) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);
  useEffect(() => {
    if (end === '...' || end === undefined) return;
    const target = typeof end === 'number' ? end : parseInt(end, 10);
    if (isNaN(target)) return;
    const start = prevEnd.current;
    prevEnd.current = target;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration]);
  return count;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
};

function KpiCard({ title, value, icon: Icon, sub, color = ACCENT_COLORS.brand, index = 0 }) {
  const displayValue = useCountUp(value);
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group"
    >
      <div
        className="relative h-full rounded-2xl border border-border/40 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[color]/5 hover:-translate-y-0.5"
        style={{ '--color': color }}
      >
        {/* Gradient accent bar */}
        <div
          className="absolute top-0 left-4 right-4 h-0.5 rounded-full opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:h-1"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
        />

        <div className="flex items-center justify-between mb-4">
          <div
            className="relative p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color}15, ${color}08)`,
              boxShadow: `0 0 0 1px ${color}20`,
            }}
          >
            <Icon className="w-[18px] h-[18px]" style={{ color }} />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.06 }}
            className="flex items-center gap-1 text-[11px] font-medium"
            style={{ color: `${color}99` }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{Math.floor(Math.random() * 20 + 5)}%</span>
          </motion.div>
        </div>

        <div className="text-3xl font-bold tracking-tight text-foreground mb-1 font-display">
          {value === '...' ? (
            <span className="inline-block w-10 h-7 bg-muted rounded animate-pulse" />
          ) : displayValue}
        </div>

        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {sub && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1 h-1 rounded-full" style={{ background: color }} />
            <span className="text-[11px] text-muted-foreground/60">{sub}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: properties = [], isLoading: loadingProps } = usePartnerHotels();
  const { data: contactsResult, isLoading: loadingContacts } = useQuery({
    queryKey: ['dashboard-contacts'],
    queryFn: () => listContacts({ limit: 500 }),
  });

  const contacts = contactsResult?.data || [];
  const isLoading = loadingProps || loadingContacts;

  const activeMembers = contacts.filter(c => c.membership_status === 'active').length;
  const sansEmail = contacts.filter(c => !c.login_email || c.login_email.trim() === '').length;
  const avecSimpleBooking = contacts.filter(c => c.simple_booking_link && c.simple_booking_link.trim() !== '').length;
  const avecChannelManager = contacts.filter(c => c.channel_manager && c.channel_manager.trim() !== '').length;

  const kpis = [
    { title: t('dashboard.totalProperties'), value: isLoading ? '...' : properties.length, icon: Building2, sub: t('dashboard.outOfContacts', { count: contacts.length }), color: ACCENT_COLORS.brand },
    { title: t('dashboard.activeMembers'), value: isLoading ? '...' : activeMembers, icon: Users, sub: t('dashboard.outOfContacts', { count: contacts.length }), color: ACCENT_COLORS.green },
    { title: t('dashboard.withSimpleBooking'), value: isLoading ? '...' : avecSimpleBooking, icon: BookOpen, sub: t('dashboard.simpleBookingFilled'), color: ACCENT_COLORS.blue },
    { title: t('dashboard.withChannelManager'), value: isLoading ? '...' : avecChannelManager, icon: BarChart3, sub: t('dashboard.channelManagerFilled'), color: ACCENT_COLORS.purple },
    { title: t('dashboard.noAccessEmail'), value: isLoading ? '...' : sansEmail, icon: Mail, sub: t('dashboard.emptyLoginEmail'), color: ACCENT_COLORS.rose },
    { title: t('dashboard.activeMembers'), value: isLoading ? '...' : activeMembers, icon: CheckCircle, sub: t('dashboard.outOfContacts', { count: contacts.length }), color: ACCENT_COLORS.amber },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="space-y-1"
      >
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.title} {...k} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
