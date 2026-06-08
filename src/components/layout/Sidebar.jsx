import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Settings,
  ChevronRight, LogOut, ExternalLink, Compass, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/i18n';

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function Sidebar({ collapsed, onToggle, propertiesCount }) {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
    { path: '/properties', icon: Building2, labelKey: 'sidebar.properties', badgeKey: 'properties' },
    { path: '/experiences', icon: Compass, labelKey: 'sidebar.experiences' },
    { path: '/destinations', icon: MapPin, labelKey: 'sidebar.destinations' },
    { path: '/settings', icon: Settings, labelKey: 'sidebar.settings' },
  ];

  const getBadge = (item) => {
    if (item.badgeKey === 'properties' && propertiesCount > 0) return propertiesCount;
    return null;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-out
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="px-4 h-16 flex items-center gap-3 border-b border-border">
        <motion.img
          src="https://media.base44.com/images/public/69f10e36f5d3972acca5a916/87a1cfef6_Artboard47x-8.png"
          alt="HWS Logo"
          className="flex-shrink-0 object-contain"
          animate={{ width: collapsed ? 32 : 36, height: collapsed ? 32 : 36 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="text-xs font-semibold text-foreground">MGH</div>
              <div className="text-[11px] text-muted-foreground">Property Management</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const badge = getBadge(item);
          const IconComponent = item.icon;
          return (
            <motion.div
              key={item.path}
              custom={index}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                to={item.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }
                  ${collapsed ? 'justify-center' : 'justify-between'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="flex items-center gap-3 relative z-10">
                  <IconComponent className="w-[18px] h-[18px] flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="truncate"
                      >
                        {t(item.labelKey)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {!collapsed && badge !== null && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary min-w-[20px] text-center relative z-10"
                  >
                    {badge}
                  </motion.span>
                )}
                {collapsed && badge !== null && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Bottom */}
      <div className="p-2 space-y-1">
        <a
          href="/portal"
          target="_blank"
          rel="noreferrer"
          className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium w-full
            text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200
            ${collapsed ? 'justify-center' : ''}`}
        >
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && <span>{t('sidebar.ownerPortal')}</span>}
        </a>
        <button
          onClick={() => base44.auth.logout()}
          className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full
            text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{t('sidebar.logout')}</span>}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </Button>
      </div>
    </aside>
  );
}
