import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { useQuery } from '@tanstack/react-query';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/i18n';

const FLAG_ITEMS = [
  { code: 'en', src: '/flags/en.svg', label: 'EN' },
  { code: 'fr', src: '/flags/fr.svg', label: 'FR' },
  { code: 'es', src: '/flags/es.svg', label: 'ES' },
];

const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { lang, setLang, t } = useTranslation();
  const location = useLocation();

  const { data: properties = [] } = usePartnerHotels();
  const { data: pendingUpdates } = useQuery({
    queryKey: ['layout-pending-count'],
    queryFn: () => base44.entities.pending_updates.filter({ status: 'pending' }),
    initialData: [],
    staleTime: 30000,
  });

  const propertiesCount = properties.length;
  const pendingCount = pendingUpdates?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        propertiesCount={propertiesCount}
        pendingCount={pendingCount}
      />
      <main className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col min-h-screen ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Gold accent divider at top */}
        <div className="h-[1px] w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.3), transparent)' }} />

        {/* Top bar with lang toggle */}
        <div className="flex items-center justify-between px-6 pt-4 pb-0">
          <div className="flex-1" />
          <div className="flex items-center rounded-full border border-border/60 overflow-hidden shadow-sm bg-card/80 backdrop-blur-sm">
            {FLAG_ITEMS.map((item) => (
              <button
                key={item.code}
                onClick={() => setLang(item.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  lang === item.code
                    ? 'bg-[#9F121A] text-white shadow-sm'
                    : 'bg-transparent text-muted-foreground hover:bg-[#9F121A]/5 hover:text-foreground'
                }`}
              >
                <img src={item.src} alt={item.label} className="w-4 h-3 object-cover rounded-sm" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Page content with animated transitions */}
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto flex-1 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="text-center text-xs text-brand-subtitle/40 py-4 border-t border-border/40 mt-4">
          <div className="gold-divider w-24 mx-auto mb-3" />
          {t('footer.copyright')}
        </footer>
      </main>
    </div>
  );
}
