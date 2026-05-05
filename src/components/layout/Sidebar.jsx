import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Clock, Users, PlusCircle, Settings,
  ChevronLeft, ChevronRight, LogOut, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/properties', icon: Building2, label: 'Propriétés', badgeKey: 'properties' },
  { path: '/pending-updates', icon: Clock, label: 'Modifications en attente', badgeKey: 'pending', badgeColor: 'bg-red-600' },
  { path: '/members', icon: Users, label: 'Membres MGH' },
  { path: '/add-riad', icon: PlusCircle, label: 'Ajouter un riad' },
  { path: '/users', icon: Settings, label: 'Utilisateurs' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar({ collapsed, onToggle, propertiesCount, pendingCount }) {
  const location = useLocation();

  const getBadge = (item) => {
    if (item.badgeKey === 'properties' && propertiesCount > 0) return propertiesCount;
    if (item.badgeKey === 'pending' && pendingCount > 0) return pendingCount;
    return null;
  };

  return (
    <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col
      ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ background: '#1a1a1a' }}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 min-h-[72px]">
        <img
          src="https://media.base44.com/images/public/69f10e36f5d3972acca5a916/87a1cfef6_Artboard47x-8.png"
          alt="HWS Logo"
          className={`flex-shrink-0 object-contain transition-all duration-300 ${collapsed ? 'w-8 h-8' : 'w-28 h-auto'}`}
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-[11px] text-gray-400 leading-tight">MGH Dashboard</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const badge = getBadge(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
                ${collapsed ? 'justify-center' : 'justify-between'}`}
              style={isActive ? { background: '#8B1A1A' } : {}}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!collapsed && badge !== null && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full text-white min-w-[20px] text-center ${item.badgeColor || 'bg-gray-600'}`}>
                  {badge}
                </span>
              )}
              {collapsed && badge !== null && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-white/10 space-y-1">
        <a
          href="/portal"
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium w-full
            text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all
            ${collapsed ? 'justify-center' : ''}`}
        >
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && <span>Portail propriétaires</span>}
        </a>
        <button
          onClick={() => base44.auth.logout()}
          className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium w-full
            text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full text-gray-500 hover:text-gray-300 hover:bg-white/5"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}