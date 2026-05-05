import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Mail, Clock, BookOpen, BarChart3, CheckCircle, Image, FileText } from 'lucide-react';
import { listProperties, listContacts } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

function KpiCard({ title, value, icon: Icon, sub, color = '#8B1A1A' }) {
  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg" style={{ background: '#fdf2f2' }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm font-medium text-gray-700">{title}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function CompletionBar({ label, pct }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 w-64 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: '#8B1A1A' }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-12 text-right">{pct}%</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: propsResult, isLoading: loadingProps } = useQuery({
    queryKey: ['dashboard-properties'],
    queryFn: () => listProperties({ limit: 500 }),
  });
  const { data: contactsResult, isLoading: loadingContacts } = useQuery({
    queryKey: ['dashboard-contacts'],
    queryFn: () => listContacts({ limit: 500 }),
  });
  const { data: pendingUpdates = [], isLoading: loadingPending } = useQuery({
    queryKey: ['dashboard-pending'],
    queryFn: () => base44.entities.pending_updates.filter({ status: 'pending' }),
    initialData: [],
  });

  const properties = propsResult?.data || [];
  const contacts = contactsResult?.data || [];
  const isLoading = loadingProps || loadingContacts || loadingPending;

  const activeMembers = contacts.filter(c => c.membership_status === 'active').length;
  const sansEmail = contacts.filter(c => !c.login_email || c.login_email.trim() === '').length;
  const avecSimpleBooking = contacts.filter(c => c.simple_booking_link && c.simple_booking_link.trim() !== '').length;
  const avecChannelManager = contacts.filter(c => c.channel_manager && c.channel_manager.trim() !== '').length;

  // Completion stats
  const pctDescFR = properties.length
    ? Math.round(properties.filter(p => p.description?.fr && p.description.fr.trim() !== '').length / properties.length * 100)
    : 0;
  const pctPhotos = properties.length
    ? Math.round(properties.filter(p => p.image_urls && p.image_urls.length > 0).length / properties.length * 100)
    : 0;
  const pctEmailAcces = contacts.length
    ? Math.round(contacts.filter(c => c.login_email && c.login_email.trim() !== '').length / contacts.length * 100)
    : 0;

  const kpis = [
    { title: 'Total propriétés', value: isLoading ? '…' : properties.length, icon: Building2, sub: 'mgh_properties_final' },
    { title: 'Membres actifs', value: isLoading ? '…' : activeMembers, icon: CheckCircle, sub: `sur ${contacts.length} contacts`, color: '#16a34a' },
    { title: 'Sans email d\'accès', value: isLoading ? '…' : sansEmail, icon: Mail, sub: 'login_email vide', color: '#dc2626' },
    { title: 'En attente validation', value: isLoading ? '…' : pendingUpdates.length, icon: Clock, sub: 'pending_updates', color: '#d97706' },
    { title: 'Avec Simple Booking', value: isLoading ? '…' : avecSimpleBooking, icon: BookOpen, sub: 'simple_booking_link renseigné', color: '#2563eb' },
    { title: 'Avec channel manager', value: isLoading ? '…' : avecChannelManager, icon: BarChart3, sub: 'channel_manager renseigné', color: '#7c3aed' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1 text-sm">Vue d'ensemble de l'association MGH</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      {/* Completion stats */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">Taux de complétion des fiches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}</div>
          ) : (
            <>
              <CompletionBar label="Fiches avec description FR remplie" pct={pctDescFR} />
              <CompletionBar label="Fiches avec photos" pct={pctPhotos} />
              <CompletionBar label="Membres avec email d'accès" pct={pctEmailAcces} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent pending */}
      {pendingUpdates.length > 0 && (
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              Modifications en attente
            </CardTitle>
            <Link to="/pending-updates" className="text-sm font-medium hover:underline" style={{ color: '#8B1A1A' }}>
              Voir tout →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingUpdates.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{u.property_name}</span>
                    <span className="text-xs text-gray-400 ml-2">par {u.updated_by_email}</span>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    {Object.keys(u.changes || {}).length} champ(s)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}