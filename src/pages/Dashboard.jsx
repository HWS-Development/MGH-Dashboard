import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Clock, BookOpen, BarChart3, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { listContacts } from '@/lib/api';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';

const PRIMARY = 'hsl(239 84% 67%)';
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
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  }),
};

function getIconStyle(color) {
  const map = {
    [ACCENT_COLORS.brand]: 'from-indigo-500/20 to-indigo-500/5',
    [ACCENT_COLORS.green]: 'from-emerald-500/20 to-emerald-500/5',
    [ACCENT_COLORS.amber]: 'from-amber-500/20 to-amber-500/5',
    [ACCENT_COLORS.blue]: 'from-blue-500/20 to-blue-500/5',
    [ACCENT_COLORS.purple]: 'from-purple-500/20 to-purple-500/5',
    [ACCENT_COLORS.rose]: 'from-rose-500/20 to-rose-500/5',
  };
  return map[color] || 'from-indigo-500/20 to-indigo-500/5';
}

function KpiCard({ title, value, icon: Icon, sub, color = ACCENT_COLORS.brand, index = 0 }) {
  const displayValue = useCountUp(value);
  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible">
      <Card className="card-hover cursor-default">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getIconStyle(color)} flex items-center justify-center`}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            {index === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <TrendingUp className="w-4 h-4 text-primary/60" />
              </motion.div>
            )}
          </div>
          <div className="stat-value text-foreground mb-1">
            {value === '...' ? (
              <span className="inline-block w-8 h-6 bg-muted rounded animate-pulse-soft" />
            ) : displayValue}
          </div>
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          {sub && (
            <div className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-primary/60" />
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
    { title: t('dashboard.totalProperties'), value: isLoading ? '...' : properties.length, icon: Building2, sub: 'mgh_properties_final', color: ACCENT_COLORS.brand },
    { title: t('dashboard.activeMembers'), value: isLoading ? '...' : activeMembers, icon: CheckCircle, sub: t('dashboard.outOfContacts', { count: contacts.length }), color: ACCENT_COLORS.green },
    { title: t('dashboard.noAccessEmail'), value: isLoading ? '...' : sansEmail, icon: Mail, sub: t('dashboard.emptyLoginEmail'), color: ACCENT_COLORS.rose },
    { title: t('dashboard.pendingValidation'), value: isLoading ? '...' : pendingUpdates.length, icon: Clock, sub: 'pending_updates', color: ACCENT_COLORS.amber },
    { title: t('dashboard.withSimpleBooking'), value: isLoading ? '...' : avecSimpleBooking, icon: BookOpen, sub: t('dashboard.simpleBookingFilled'), color: ACCENT_COLORS.blue },
    { title: t('dashboard.withChannelManager'), value: isLoading ? '...' : avecChannelManager, icon: BarChart3, sub: t('dashboard.channelManagerFilled'), color: ACCENT_COLORS.purple },
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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.title} {...k} index={i} />
        ))}
      </div>

      {/* Pending changes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="section-title">
              <Clock className="w-4 h-4 text-primary" />
              {t('dashboard.pendingChanges')}
            </CardTitle>
            <Link
              to="/pending-updates"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              {t('common.viewAll')}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {pendingUpdates.slice(0, 5).map((u, i) => (
                <motion.div
                  key={u.id}
                  className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg transition-colors hover:bg-muted/50 cursor-default"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-foreground">{u.property_name}</span>
                      <span className="text-xs ml-2 text-muted-foreground">
                        {t('common.by')} {u.updated_by_email}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {Object.keys(u.changes || {}).length} {t('common.fields')}
                  </span>
                </motion.div>
              ))}
              {pendingUpdates.length === 0 && (
                <div className="text-sm py-4 text-center text-muted-foreground">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
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
