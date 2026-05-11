import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listContacts } from '@/lib/api';
import { usePartnerHotels } from '@/lib/partnerHotelsApi';
import { base44 } from '@/api/base44Client';
import DirectorOverview from './DirectorOverview';
import DirectorDirectory from './DirectorDirectory';
import DirectorStats from './DirectorStats';
import { BarChart3, BookOpen, Globe, LogOut } from 'lucide-react';

const TABS = [
  { key: 'overview', label: '📊 Vue globale', icon: BarChart3 },
  { key: 'directory', label: '🏡 Annuaire des membres', icon: BookOpen },
  { key: 'stats', label: '📈 Statistiques', icon: Globe },
];

export default function DirectorApp({ session, onLogout }) {
  const [tab, setTab] = useState('overview');

  const { data: properties = [], isLoading: loadingProps } = usePartnerHotels();
  const { data: contactsResult, isLoading: loadingContacts } = useQuery({
    queryKey: ['director-contacts'],
    queryFn: () => listContacts({ limit: 500 }),
  });
  const { data: pendingUpdates = [] } = useQuery({
    queryKey: ['director-pending'],
    queryFn: () => base44.entities.pending_updates.filter({ status: 'approved' }),
    initialData: [],
  });

  const contacts = contactsResult?.data || [];
  const isLoading = loadingProps || loadingContacts;

  const handleLogout = () => {
    localStorage.removeItem('mgh_director_session');
    onLogout();
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F5' }}>
      {/* Top nav */}
      <div className="sticky top-0 z-40 border-b border-border card-dark shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: '#384252' }}>
                MGH
              </div>
              <div>
                <div className="font-bold text-sm leading-tight" style={{ color: '#9F121A' }}>HWS</div>
                <div className="text-[10px] text-muted-foreground leading-tight">MGH Dashboard</div>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    tab === t.key ? 'text-white' : 'text-muted-foreground hover:text-foreground/80 hover:bg-muted'
                  }`}
                  style={tab === t.key ? { background: '#384252' } : {}}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session?.name || 'Direction MGH'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-muted-foreground text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Déconnexion</span>
            </button>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto px-4 pb-2 gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                tab === t.key ? 'text-white' : 'text-muted-foreground bg-muted'
              }`}
              style={tab === t.key ? { background: '#384252' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'overview' && (
          <DirectorOverview
            properties={properties}
            contacts={contacts}
            pendingUpdates={pendingUpdates}
            isLoading={isLoading}
          />
        )}
        {tab === 'directory' && (
          <DirectorDirectory
            properties={properties}
            contacts={contacts}
            isLoading={isLoading}
          />
        )}
        {tab === 'stats' && (
          <DirectorStats
            properties={properties}
            contacts={contacts}
            isLoading={isLoading}
          />
        )}
      </div>

      <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border mt-8">
        © 2025 Hospitality Web Services — MGH Dashboard v1.0
      </footer>
    </div>
  );
}