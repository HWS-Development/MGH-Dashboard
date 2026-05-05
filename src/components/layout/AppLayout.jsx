import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useQuery } from '@tanstack/react-query';
import { listProperties } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
export const LangContext = React.createContext('fr');

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [lang, setLang] = useState('fr');

  const { data: propsResult } = useQuery({
    queryKey: ['layout-properties-count'],
    queryFn: () => listProperties({ limit: 500 }),
    staleTime: 60000,
  });
  const { data: pendingUpdates } = useQuery({
    queryKey: ['layout-pending-count'],
    queryFn: () => base44.entities.pending_updates.filter({ status: 'pending' }),
    initialData: [],
    staleTime: 30000,
  });

  const propertiesCount = propsResult?.data?.length || 0;
  const pendingCount = pendingUpdates?.length || 0;

  return (
    <LangContext.Provider value={lang}>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          propertiesCount={propertiesCount}
          pendingCount={pendingCount}
        />
        <main className={`transition-all duration-300 flex flex-col min-h-screen ${collapsed ? 'ml-16' : 'ml-64'}`}>
          {/* Top bar with lang toggle */}
          <div className="flex items-center justify-end px-6 pt-4 pb-0">
            <button
              onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')}
              className="text-xs font-medium px-3 py-1 rounded-full border border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-all"
            >
              {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </button>
          </div>
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto flex-1 w-full">
            <Outlet />
          </div>
          <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 mt-4">
            © 2025 Hospitality Web Services — MGH Dashboard v1.0
          </footer>
        </main>
      </div>
    </LangContext.Provider>
  );
}