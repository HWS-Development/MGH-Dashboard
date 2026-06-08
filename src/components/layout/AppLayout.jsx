import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { useTranslation } from '@/i18n';

const FLAG_ITEMS = [
  { code: 'en', src: '/flags/en.svg', label: 'EN' },
  { code: 'fr', src: '/flags/fr.svg', label: 'FR' },
  { code: 'es', src: '/flags/es.svg', label: 'ES' },
];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { lang, setLang, t } = useTranslation();
  const location = useLocation();

  const { data: properties = [] } = usePartnerHotels();

  const propertiesCount = properties.length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        propertiesCount={propertiesCount}
      />
      <main className={`transition-all duration-300 ease-out flex flex-col min-h-screen ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-6 h-14">
            <div className="flex-1" />
            <div className="flex items-center rounded-lg border border-border overflow-hidden bg-card">
              {FLAG_ITEMS.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLang(item.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    lang === item.code
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <img src={item.src} alt={item.label} className="w-4 h-3 object-cover rounded-sm" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 lg:p-8 max-w-[1440px] mx-auto flex-1 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="text-center text-xs text-muted-foreground/60 py-4 border-t border-border mt-4">
          {t('footer.copyright')}
        </footer>
      </main>
    </div>
  );
}
