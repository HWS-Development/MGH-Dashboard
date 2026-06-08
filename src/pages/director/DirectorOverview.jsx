import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

const STATUS_COLOR = {
  active: '#16a34a',
  suspended: '#f97316',
  pending: '#2563eb',
  'ex-member': '#9ca3af',
};

function KpiCard({ label, value, color, isLoading }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 text-center shadow-sm">
      {isLoading ? (
        <Skeleton className="h-10 w-16 mx-auto mb-2" />
      ) : (
        <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
      )}
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default function DirectorOverview({ properties, contacts, pendingUpdates, isLoading }) {
  // JOIN: mgh_contacts.property_id = mgh_properties_final.id
  const contactsMap = useMemo(() => {
    const m = {};
    contacts.forEach(c => { if (c.property_id) m[c.property_id] = c; });
    return m;
  }, [contacts]);

  const kpis = useMemo(() => {
    const active = contacts.filter(c => c.membershipstatus === 'active').length;
    const suspended = contacts.filter(c => c.membershipstatus === 'suspended').length;
    const pending = contacts.filter(c => c.membershipstatus === 'pending').length;
    const exMember = contacts.filter(c => c.membershipstatus === 'ex-member').length;
    return { active, suspended, pending, exMember };
  }, [contacts]);

  // mgh_contacts.email = platform access email
  const noEmailCount = contacts.filter(c => !c.email).length;

  // Properties with valid GPS
  const mappableProps = useMemo(() =>
    properties.filter(p => {
      const lng = parseFloat(p.longitude);
      const lat = parseFloat(p.latitude);
      return !isNaN(lng) && !isNaN(lat) && lat !== 0 && lng !== 0;
    }),
    [properties]
  );

  const recentActivity = [...pendingUpdates]
    .sort((a, b) => new Date(b.approved_at || b.updated_at) - new Date(a.approved_at || a.updated_at))
    .slice(0, 10);

  const formatDate = (d) => {
    try { return format(new Date(d), 'dd/MM/yyyy HH:mm'); } catch { return '—'; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vue globale</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tableau de bord de l'association MGH</p>
      </div>

      {/* Alert */}
      {noEmailCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            {noEmailCount} propriété{noEmailCount > 1 ? 's' : ''} sans email d'accès — à régulariser
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Membres actifs" value={kpis.active} color="#16a34a" isLoading={isLoading} />
        <KpiCard label="Suspendus" value={kpis.suspended} color="#f97316" isLoading={isLoading} />
        <KpiCard label="En attente" value={kpis.pending} color="#2563eb" isLoading={isLoading} />
        <KpiCard label="Ex-membres" value={kpis.exMember} color="#9ca3af" isLoading={isLoading} />
      </div>

      {/* Map */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold text-foreground/80">Carte des propriétés ({mappableProps.length} géolocalisées)</h2>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
                {status === 'active' ? 'Actif' : status === 'suspended' ? 'Suspendu' : status === 'pending' ? 'En attente' : 'Ex-membre'}
              </span>
            ))}
          </div>
        </div>
        <div style={{ height: '400px' }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Chargement de la carte…</div>
          ) : (
            <MapContainer
              center={[31.7, -6.8]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {mappableProps.map(p => {
                const c = contactsMap[p.id] || {};
                const lng = parseFloat(p.longitude);
                const lat = parseFloat(p.latitude);
                const color = STATUS_COLOR[c.membershipstatus] || STATUS_COLOR['ex-member'];
                let name = p.name;
                if (typeof name === 'string') { try { name = JSON.parse(name); } catch { name = {}; } }
                const displayName = name?.fr || p.riadname || 'Sans nom';
                return (
                  <CircleMarker
                    key={p.id}
                    center={[lat, lng]}
                    radius={7}
                    pathOptions={{ color: 'white', weight: 1.5, fillColor: color, fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{displayName}</div>
                        {c.contactname && <div className="text-muted-foreground text-xs mt-0.5">{c.contactname}</div>}
                        {c.membershipstatus && (
                          <div className="text-xs mt-1 font-medium" style={{ color }}>
                            {c.membershipstatus}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground/80">Activité récente (10 dernières modifications approuvées)</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">Aucune activité récente ✅</div>
          ) : (
            recentActivity.map(u => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-foreground/80">{u.property_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">par {u.updated_by_email}</span>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">{formatDate(u.approved_at || u.updated_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}