import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Clock, BookOpen, BarChart3, CheckCircle, TrendingUp } from 'lucide-react';
import { listContacts } from '@/lib/api';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';

const GOLD = '#D4A853';
const BRAND = '#9F121A';

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
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  }),
};

const iconBgGradients = {
  red: 'linear-gradient(135deg, rgba(159,18,26,0.12) 0%, rgba(159,18,26,0.04) 100%)',
  green: 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0.04) 100%)',
  gold: 'linear-gradient(135deg, rgba(212,168,83,0.15) 0%, rgba(212,168,83,0.04) 100%)',
  purple: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)',
  blue: 'linear-gradient(135deg, rgba(123,148,176,0.12) 0%, rgba(123,148,176,0.04) 100%)',
  orange: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 100%)',
};

function getGrad(color) {
  const map = {
    '#9F121A': iconBgGradients.red,
    '#4ade80': iconBgGradients.green,
    '#D4A853': iconBgGradients.gold,
    '#f87171': iconBgGradients.red,
    '#fbbf24': iconBgGradients.orange,
    '#7B94B0': iconBgGradients.blue,
    '#a78bfa': iconBgGradients.purple,
  };
  return map[color] || iconBgGradients.red;
}

function KpiCard({ title, value, icon: Icon, sub, color = BRAND, index = 0 }) {
  const displayValue = useCountUp(value);
  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible" className="group">
      <Card
        className="relative overflow-hidden rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm transition-all duration-300 premium-shadow-hover cursor-default"
      >
        {/* Gold accent corner */}
        <div
          className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at top right, rgba(212,168,83,0.15) 0%, transparent 70%)',
          }}
        />

        <CardContent className="p-5 relative">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ background: getGrad(color) }}
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </motion.div>
            {index === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <TrendingUp className="w-4 h-4 text-[#D4A853]/60" />
              </motion.div>
            )}
          </div>
          <motion.div
            className="text-3xl font-bold tracking-tight tabular-nums mb-1"
            style={{ color: '#384252' }}
          >
            {value === '...' ? (
              <span className="inline-block w-8 h-6 bg-muted rounded animate-pulse-soft" />
            ) : displayValue}
          </motion.div>
          <div className="text-sm font-medium text-[#6B7280]">{title}</div>
          {sub && (
            <div className="text-xs text-[#6B7280]/60 mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-[#D4A853]" />
              {sub}
            </div>
          )}
        </CardContent>
      </Card>
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
  const { data: pendingUpdates = [], isLoading: loadingPending } = useQuery({
    queryKey: ['dashboard-pending'],
    queryFn: () => base44.entities.pending_updates.filter({ status: 'pending' }),
    initialData: [],
  });

  const contacts = contactsResult?.data || [];
  const isLoading = loadingProps || loadingContacts || loadingPending;

  const activeMembers = contacts.filter(c => c.membership_status === 'active').length;
  const sansEmail = contacts.filter(c => !c.login_email || c.login_email.trim() === '').length;
  const avecSimpleBooking = contacts.filter(c => c.simple_booking_link && c.simple_booking_link.trim() !== '').length;
  const avecChannelManager = contacts.filter(c => c.channel_manager && c.channel_manager.trim() !== '').length;

  const kpis = [
    { title: t('dashboard.totalProperties'), value: isLoading ? '...' : properties.length, icon: Building2, sub: 'mgh_properties_final', color: BRAND },
    { title: t('dashboard.activeMembers'), value: isLoading ? '...' : activeMembers, icon: CheckCircle, sub: t('dashboard.outOfContacts', { count: contacts.length }), color: '#4ade80' },
    { title: t('dashboard.noAccessEmail'), value: isLoading ? '...' : sansEmail, icon: Mail, sub: t('dashboard.emptyLoginEmail'), color: '#f87171' },
    { title: t('dashboard.pendingValidation'), value: isLoading ? '...' : pendingUpdates.length, icon: Clock, sub: 'pending_updates', color: '#fbbf24' },
    { title: t('dashboard.withSimpleBooking'), value: isLoading ? '...' : avecSimpleBooking, icon: BookOpen, sub: t('dashboard.simpleBookingFilled'), color: '#7B94B0' },
    { title: t('dashboard.withChannelManager'), value: isLoading ? '...' : avecChannelManager, icon: BarChart3, sub: t('dashboard.channelManagerFilled'), color: '#a78bfa' },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-6 w-[3px] rounded-full" style={{ background: GOLD }} />
          <h1 className="text-2xl font-display font-semibold tracking-tight" style={{ color: '#384252' }}>
            {t('dashboard.title')}
          </h1>
        </div>
        <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
          {t('dashboard.subtitle')}
        </p>
        <div className="gold-divider w-32" />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.title} {...k} index={i} />
        ))}
      </div>

      {/* Pending changes section */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="relative overflow-hidden rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm">
          <div
            className="absolute top-0 left-0 w-full h-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.4), transparent)' }}
          />
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2" style={{ color: '#384252' }}>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Clock className="w-4 h-4" style={{ color: GOLD }} />
              </motion.div>
              {t('dashboard.pendingChanges')}
            </CardTitle>
            <Link
              to="/pending-updates"
              className="text-sm font-medium transition-all duration-200 hover:gap-3 flex items-center gap-1"
              style={{ color: BRAND }}
            >
              {t('common.viewAll')}
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {pendingUpdates.slice(0, 5).map((u, i) => (
                <motion.div
                  key={u.id}
                  className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg transition-all duration-200 hover:bg-[#F8F0E0]/50 cursor-default"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: GOLD }}
                    />
                    <div>
                      <span className="text-sm font-medium" style={{ color: '#384252' }}>{u.property_name}</span>
                      <span className="text-xs ml-2" style={{ color: '#6B7280' }}>
                        {t('common.by')} {u.updated_by_email}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(212,168,83,0.12)',
                      color: '#8B7430',
                    }}
                  >
                    {Object.keys(u.changes || {}).length} {t('common.fields')}
                  </span>
                </motion.div>
              ))}
              {pendingUpdates.length === 0 && (
                <div className="text-sm py-4 text-center" style={{ color: '#6B7280' }}>
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-[#4ade80]" />
                  {t('dashboard.noPendingChanges')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
