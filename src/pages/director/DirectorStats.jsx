import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#16a34a', '#f97316', '#2563eb', '#9ca3af', '#384252', '#7c3aed', '#0891b2', '#d97706'];

function ChartCard({ title, children, isLoading }) {
  return (
    <div className="card-dark rounded-xl border border-border shadow-sm p-5">
      <h3 className="font-semibold text-foreground/80 mb-4">{title}</h3>
      {isLoading ? <Skeleton className="h-48 w-full" /> : children}
    </div>
  );
}

export default function DirectorStats({ properties, contacts, isLoading }) {
  const statusData = useMemo(() => {
    const counts = {};
    contacts.forEach(c => {
      const s = c.membershipstatus || 'inconnu';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name === 'active' ? 'Actif' : name === 'suspended' ? 'Suspendu' : name === 'pending' ? 'En attente' : name === 'ex-member' ? 'Ex-membre' : name, value }));
  }, [contacts]);

  const cityData = useMemo(() => {
    const counts = {};
    properties.forEach(p => {
      const city = p.city_id || 'Inconnue';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value]) => ({ name, value }));
  }, [properties]);

  const cmData = useMemo(() => {
    const counts = {};
    contacts.forEach(c => {
      const cm = c.CM?.trim() || 'Aucun';
      counts[cm] = (counts[cm] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [contacts]);

  const completionData = useMemo(() => {
    const withDescFR = properties.filter(p => p.description?.fr?.trim()).length;
    const withPhotos = properties.filter(p => p.image_urls?.length > 0).length;
    const contactsMap = {};
    contacts.forEach(c => { if (c.property_id) contactsMap[c.property_id] = c; });
    const withSB = contacts.filter(c => c.simplebookinglink?.trim()).length;
    const total = properties.length || 1;
    return [
      { name: 'Avec desc. FR', value: withDescFR, without: total - withDescFR },
      { name: 'Avec photos', value: withPhotos, without: total - withPhotos },
      { name: 'Avec Simple Booking', value: withSB, without: contacts.length - withSB },
    ];
  }, [properties, contacts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{properties.length} propriétés · {contacts.length} contacts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut — statut adhésion */}
        <ChartCard title="Répartition par statut d'adhésion" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar — villes */}
        <ChartCard title="Propriétés par ville" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cityData} layout="vertical" margin={{ left: 60, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="value" fill="#384252" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar — channel managers */}
        <ChartCard title="Channel managers les plus utilisés" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cmData} layout="vertical" margin={{ left: 60, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar — complétion fiches */}
        <ChartCard title="Complétude des fiches" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={completionData} margin={{ left: 0, right: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" name="Complètes" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="without" name="Incomplètes" fill="#fca5a5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}