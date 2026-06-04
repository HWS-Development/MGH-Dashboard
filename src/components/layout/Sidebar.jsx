import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Building2, Clock, Users, Settings,
  ChevronLeft, ChevronRight, LogOut, ExternalLink, Compass, MapPin, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/i18n';

const GOLD = '#D4A853';
const BRAND = '#9F121A';

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function Sidebar({ collapsed, onToggle, propertiesCount, pendingCount }) {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
    { path: '/properties', icon: Building2, labelKey: 'sidebar.properties', badgeKey: 'properties' },
    { path: '/pending-updates', icon: Clock, labelKey: 'sidebar.pendingUpdates', badgeKey: 'pending', badgeColor: 'bg-red-500' },
    { path: '/members', icon: Users, labelKey: 'sidebar.members' },
    { path: '/experiences', icon: Compass, labelKey: 'sidebar.experiences' },
    { path: '/destinations', icon: MapPin, labelKey: 'sidebar.destinations' },
    { path: '/users', icon: Shield, labelKey: 'sidebar.users' },
    { path: '/settings', icon: Settings, labelKey: 'sidebar.settings' },
  ];

  const getBadge = (item) => {
    if (item.badgeKey === 'properties' && propertiesCount > 0) return propertiesCount;
    if (item.badgeKey === 'pending' && pendingCount > 0) return pendingCount;
    return null;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ background: 'linear-gradient(135deg, rgb(2, 22, 42) 0%, rgb(4, 42, 74) 50%, rgb(2, 22, 42) 100%)' }}
    >
      {/* Gold accent top border */}
      <div className="h-[2px] w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg, transparent, #D4A853, transparent)' }} />

      {/* Logo */}
      <div className="p-4 border-b border-white/8 flex items-center gap-3 min-h-[72px] relative">
        <motion.img
          src="https://media.base44.com/images/public/69f10e36f5d3972acca5a916/87a1cfef6_Artboard47x-8.png"
          alt="HWS Logo"
          className="flex-shrink-0 object-contain"
          animate={{ width: collapsed ? 32 : 112, height: collapsed ? 32 : 'auto' }}
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
              <div className="text-[10px] text-white/50 leading-tight tracking-[0.2em] uppercase font-medium">
                MGH
              </div>
              <div className="text-[11px] text-white/80 leading-tight tracking-wider uppercase font-medium">
                Dashboard
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
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
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 ease-out
                  ${isActive
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : 'justify-between'}`}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(212,168,83,0.12) 0%, rgba(212,168,83,0.04) 100%)'
                    : 'transparent',
                }}
              >
                {/* Active indicator — gold bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                    style={{ background: GOLD, boxShadow: '0 0 6px rgba(212,168,83,0.5)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Gold glow on hover */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(ellipse at 30% 50%, rgba(212,168,83,0.08) 0%, transparent 70%)',
                    }}
                  />
                )}

                <div className="flex items-center gap-3 relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <IconComponent
                      className={`w-[18px] h-[18px] flex-shrink-0 transition-all duration-200
                        ${isActive ? 'text-[#D4A853]' : 'text-white/60 group-hover:text-[#D4A853]'}`}
                    />
                  </motion.div>
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

                {/* Badge */}
                {!collapsed && badge !== null && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white min-w-[20px] text-center relative z-10
                      ${item.badgeColor || 'bg-[#D4A853]/80'}`}
                  >
                    {badge}
                  </motion.span>
                )}
                {collapsed && badge !== null && (
                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${item.badgeKey === 'pending' ? 'bg-red-500 animate-pulse' : 'bg-[#D4A853]'}`} />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Gold divider */}
      <div className="px-4 py-1">
        <div className="gold-divider" />
      </div>

      {/* Bottom */}
      <div className="p-2 space-y-1">
        <a
          href="/portal"
          target="_blank"
          rel="noreferrer"
          className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium w-full
            text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200
            ${collapsed ? 'justify-center' : ''}`}
        >
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover:text-[#D4A853] transition-colors duration-200" />
          {!collapsed && <span>{t('sidebar.ownerPortal')}</span>}
        </a>
        <button
          onClick={() => base44.auth.logout()}
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full
            text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-400 transition-colors duration-200" />
          {!collapsed && <span>{t('sidebar.logout')}</span>}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full text-white/60 hover:text-white hover:bg-white/5"
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
