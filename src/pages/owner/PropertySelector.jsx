import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProperty } from '@/lib/api';
import { LogOut, ArrowRight, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function computeCompletion(property) {
  const checks = [
    !!property?.description?.fr,
    !!property?.phone,
    !!property?.email,
    property?.image_urls?.length > 0,
    property?.amenity_ids?.length > 0,
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

function PropertyCard({ contact, onSelect }) {
  const { data: property, isLoading } = useQuery({
    queryKey: ['owner-property', contact.property_id],
    queryFn: () => getProperty(contact.property_id),
    enabled: !!contact.property_id,
  });

  const completion = property ? computeCompletion(property) : 0;
  const name = property?.name?.fr || property?.name || contact.contactname || contact.property_id;
  const city = property?.city_id || '—';

  if (isLoading) {
    return <Skeleton className="h-36 w-full rounded-2xl" />;
  }

  return (
    <div className="card-dark rounded-2xl border border-white/10 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div>
        <p className="font-semibold text-white text-base leading-tight">{name}</p>
        {city !== '—' && (
          <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
            <MapPin className="w-3 h-3" />
            <span>{city}</span>
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between text-xs text-white/50 mb-1">
          <span>Complétion</span>
          <span className="font-semibold" style={{ color: completion >= 80 ? '#16a34a' : '#9F121A' }}>{completion}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${completion}%`, background: completion >= 80 ? '#16a34a' : '#9F121A' }}
          />
        </div>
      </div>
      <button
        onClick={() => onSelect(contact)}
        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
style={{ background: '#384252' }}
      >
        Accéder <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function PropertySelector({ session, onSelect, onLogout }) {
  const contactName = session.contactName;
  // Contacts come directly from the session (set at login time)
  const contacts = session.contacts || [];

  const handleLogout = () => {
    localStorage.removeItem('mgh_owner_session');
    onLogout();
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: '#02162A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 shadow-sm border-b border-white/20" style={{ background: '#384252' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
              MGH
            </div>
            <div className="text-white font-semibold text-sm">Espace Propriétaire</div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs">
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-lg font-bold text-white mb-1">
          Bonjour {contactName || session.email},
        </h1>
        <p className="text-sm text-white/50 mb-5">À quelle propriété souhaitez-vous accéder ?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map(contact => (
            <PropertyCard
              key={contact.property_id}
              contact={contact}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}