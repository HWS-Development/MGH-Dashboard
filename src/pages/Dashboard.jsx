import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Clock, BookOpen, BarChart3, CheckCircle } from 'lucide-react';
import { listContacts } from '@/lib/api';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';

/* ── Animated counter hook ── */
function useCountUp(end, duration = 800) {
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  }),
};

function KpiCard({ title, value, icon: Icon, sub, color = '#9F121A', index = 0 }) {
  const displayValue = useCountUp(value);
  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible">
      <Card className="card-dark border border-[#9F121A]/10 hover:shadow-lg hover:shadow-[#9F121A]/5 hover:-translate-y-0.5 transition-all duration-300 group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-[#9F121A]/10 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
          </div>
          <div className="text-3xl font-bold text-brand-heading mb-1 tabular-nums">
            {value === '...' ? '...' : displayValue}
          </div>
          <div className="text-sm font-medium text-brand-subtitle">{title}</div>
          {sub && <div className="text-xs text-brand-subtitle/50 mt-0.5">{sub}</div>}
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
    { title: t('dashboard.totalProperties'), value: isLoading ? '...' : properties.length, icon: Building2, sub: 'mgh_properties_final', color: '#9F121A' },
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
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-brand-heading">{t('dashboard.title')}</h1>
        <p className="text-brand-subtitle mt-1 text-sm">{t('dashboard.subtitle')}</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.title} {...k} index={i} />
        ))}
      </div>

      {/* Completion stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
          <Card className="card-dark border border-[#9F121A]/10">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold text-brand-heading flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400" />
                {t('dashboard.pendingChanges')}
              </CardTitle>
              <Link to="/pending-updates" className="text-sm font-medium text-brand-action hover:text-brand-action/80 transition-colors">
                {t('common.viewAll')} →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingUpdates.slice(0, 5).map((u, i) => (
                  <motion.div
                    key={u.id}
                    className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors duration-200"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.05, duration: 0.3 }}
                  >
                    <div>
                      <span className="text-sm font-medium text-brand-heading">{u.property_name}</span>
                      <span className="text-xs text-brand-subtitle/50 ml-2">{t('common.by')} {u.updated_by_email}</span>
                    </div>
                    <span className="text-xs bg-[#9F121A]/15 text-[#9F121A] px-2 py-0.5 rounded-full font-semibold">
                      {Object.keys(u.changes || {}).length} {t('common.fields')}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      
    </motion.div>
  );
}
