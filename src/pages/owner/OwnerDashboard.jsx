import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProperty, getContact, listAmenities, listServices, listBookingConditions } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, LogOut, CheckCircle2, Image, X, Plus, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

const SECTIONS = [
  { id: 'contact', label: 'Contact' },
  { id: 'descriptions', label: 'Descriptifs' },
  { id: 'equipements', label: 'Équipements' },
  { id: 'photos', label: 'Photos' },
];

const AMENITIES_DEFAULT = [
  { id: 'wifi', name: 'WiFi' }, { id: 'pool', name: 'Piscine' }, { id: 'hammam', name: 'Hammam' },
  { id: 'spa', name: 'Spa' }, { id: 'parking', name: 'Parking' }, { id: 'rooftop', name: 'Rooftop' },
  { id: 'restaurant', name: 'Restaurant' }, { id: 'air_conditioning', name: 'Climatisation' },
  { id: 'baby_equipment', name: 'Équipements bébé' }, { id: 'safe', name: 'Coffre-fort' },
  { id: 'family_rooms', name: 'Chambres familiales' },
];
const SERVICES_DEFAULT = [
  { id: 'breakfast', name: 'Petit-déjeuner inclus' }, { id: 'airport_transfer', name: 'Transfert aéroport' },
  { id: 'cooking_class', name: 'Cours de cuisine' }, { id: 'spa_treatments', name: 'Soins spa' },
  { id: 'laundry', name: 'Blanchisserie' }, { id: 'guided_tours', name: 'Visites guidées' },
];
const BOOKING_CONDITIONS_DEFAULT = [
  { id: 'free_cancel_48h', name: 'Annulation gratuite 48h' }, { id: 'non_refundable', name: 'Non remboursable' },
  { id: 'deposit_required', name: 'Acompte requis' }, { id: 'pay_on_site', name: 'Paiement sur place' },
  { id: 'credit_card', name: 'Carte bancaire acceptée' },
];

function FieldLabel({ children }) {
  return <label className="text-sm font-medium text-gray-700 block mb-1">{children}</label>;
}

function TextArea({ value, onChange, rows = 5, placeholder, disabled }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
      style={{ '--tw-ring-color': '#8B1A1A' }}
    />
  );
}

function CheckList({ items, selected = [], onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(item => (
        <label key={item.id} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => toggle(item.id)}
            className="rounded w-4 h-4 accent-red-800"
          />
          <span className="text-sm text-gray-700">{item.name || item.label?.fr || item.id}</span>
        </label>
      ))}
    </div>
  );
}

function SectionCard({ id, title, children }) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100" style={{ background: '#fdf9f9' }}>
        <h2 className="font-semibold text-gray-800" style={{ color: '#8B1A1A' }}>{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function computeCompletion(property, contact) {
  const checks = [
    !!property?.description?.fr,
    !!property?.phone,
    !!property?.email,
    property?.image_urls?.length > 0,
    property?.amenity_ids?.length > 0,
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

export default function OwnerDashboard({ session, onLogout, onBackToProperties }) {
  const { propertyId, email, contactName } = session;
  const queryClient = useQueryClient();

  const [form, setForm] = useState(null);
  const [originalForm, setOriginalForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: property, isLoading: loadingProp } = useQuery({
    queryKey: ['owner-property', propertyId],
    queryFn: () => getProperty(propertyId),
  });

  const { data: contact } = useQuery({
    queryKey: ['owner-contact', propertyId],
    queryFn: () => getContact(propertyId),
  });

  const { data: pendingList = [] } = useQuery({
    queryKey: ['owner-pending', propertyId],
    queryFn: () => base44.entities.pending_updates.filter({ property_id: propertyId, status: 'pending' }),
    initialData: [],
  });

  const { data: amenitiesResult } = useQuery({ queryKey: ['amenities'], queryFn: listAmenities });
  const { data: servicesResult } = useQuery({ queryKey: ['services'], queryFn: listServices });
  const { data: bookingCondResult } = useQuery({ queryKey: ['booking-conditions'], queryFn: listBookingConditions });

  const amenities = amenitiesResult?.data?.length ? amenitiesResult.data : AMENITIES_DEFAULT;
  const services = servicesResult?.data?.length ? servicesResult.data : SERVICES_DEFAULT;
  const bookingConds = bookingCondResult?.data?.length ? bookingCondResult.data : BOOKING_CONDITIONS_DEFAULT;

  useEffect(() => {
    if (property && !form) {
      const f = JSON.parse(JSON.stringify(property));
      setForm(f);
      setOriginalForm(f);
    }
  }, [property]);

  const setF = (path, value) => {
    setSaved(false);
    setForm(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build changes diff
      const changes = {};
      const tracked = ['email', 'phone', 'website', 'description', 'amenity_ids', 'service_ids', 'booking_condition_ids', 'image_urls'];
      for (const field of tracked) {
        const oldVal = originalForm?.[field];
        const newVal = form?.[field];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[field] = { old_value: oldVal, new_value: newVal };
        }
      }
      if (Object.keys(changes).length === 0) return;

      // Check for existing pending update for this property
      const existing = await base44.entities.pending_updates.filter({ property_id: propertyId, status: 'pending' });

      const record = {
        property_id: propertyId,
        property_name: property?.name?.fr || propertyId,
        updated_by_email: email,
        updated_at: new Date().toISOString(),
        status: 'pending',
        changes,
      };

      if (existing?.length > 0) {
        await base44.entities.pending_updates.update(existing[0].id, record);
      } else {
        await base44.entities.pending_updates.create(record);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-pending', propertyId] });
      setSaved(true);
    },
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({
        ...prev,
        image_urls: [...(prev.image_urls || []), file_url],
      }));
      setSaved(false);
    }
  };

  const removePhoto = (idx) => {
    const urls = [...(form?.image_urls || [])];
    urls.splice(idx, 1);
    setF('image_urls', urls);
  };

  const handleLogout = () => {
    localStorage.removeItem('mgh_owner_session');
    onLogout();
  };

  const completion = form && property ? computeCompletion(form, contact) : 0;
  const propertyName = property?.name?.fr || property?.name || 'Votre propriété';
  const hasPending = pendingList.length > 0;
  const pendingDate = hasPending ? pendingList[0].updated_at : null;

  if (loadingProp || !form) {
    return (
      <div className="min-h-screen p-4 space-y-4" style={{ background: '#f9f6f3' }}>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: '#f9f6f3' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 shadow-sm border-b border-white/20" style={{ background: '#8B1A1A' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToProperties ? (
              <button
                onClick={onBackToProperties}
                className="flex items-center gap-1 text-white/80 hover:text-white text-xs mr-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Mes propriétés
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                MGH
              </div>
            )}
            <div>
              <div className="text-white font-semibold text-sm leading-tight">Espace Propriétaire</div>
              <div className="text-white/70 text-xs leading-tight">{propertyName}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs">
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Welcome + completion */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">
                Bienvenue, {contactName || email}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{propertyName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold" style={{ color: completion >= 80 ? '#16a34a' : '#8B1A1A' }}>{completion}%</div>
              <div className="text-xs text-gray-400">complet</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Votre fiche est complétée à {completion}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${completion}%`, background: completion >= 80 ? '#16a34a' : '#8B1A1A' }}
              />
            </div>
            {completion < 100 && (
              <p className="text-xs text-gray-400 mt-1.5">
                Complétez votre fiche pour améliorer votre visibilité sur centraledesriads.com
              </p>
            )}
          </div>
        </div>

        {/* Pending notice */}
        {hasPending && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Modifications en attente de validation HWS</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Soumises le {pendingDate ? format(new Date(pendingDate), 'dd/MM/yyyy à HH:mm') : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Anchor nav */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-white hover:border-transparent transition-all"
              style={{}}
              onMouseEnter={e => { e.currentTarget.style.background = '#8B1A1A'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}
            >
              {s.label}
            </a>
          ))}
        </div>

        {/* SECTION 1 — Contact */}
        <SectionCard id="contact" title="Informations de contact visibles sur le site">
          <div>
            <FieldLabel>Email de réservation</FieldLabel>
            <Input
              type="email"
              value={form.email || ''}
              onChange={e => setF('email', e.target.value)}
              placeholder="reservations@monriad.ma"
            />
          </div>
          <div>
            <FieldLabel>Téléphone de réservation</FieldLabel>
            <Input
              value={form.phone || ''}
              onChange={e => setF('phone', e.target.value)}
              placeholder="+212 …"
            />
          </div>
          <div>
            <FieldLabel>Site web</FieldLabel>
            <Input
              value={form.website || ''}
              onChange={e => setF('website', e.target.value)}
              placeholder="https://www.monriad.ma"
            />
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-0.5">Votre email de connexion</p>
            <p className="text-sm text-gray-800 font-mono">{contact?.email || email}</p>
            <p className="text-xs text-gray-400 mt-1">Pour modifier cet email, contactez HWS.</p>
          </div>
        </SectionCard>

        {/* SECTION 2 — Descriptifs */}
        <SectionCard id="descriptions" title="Descriptifs de votre propriété">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700">
            Décrivez votre propriété en français. HWS s'occupera de la traduction en anglais et espagnol lors de la validation.
          </div>
          <div>
            <FieldLabel>Description en français</FieldLabel>
            <TextArea
              value={form.description?.fr}
              onChange={v => setF('description.fr', v)}
              rows={6}
              placeholder="Décrivez votre riad : son histoire, son architecture, son atmosphère…"
            />
          </div>
        </SectionCard>

        {/* SECTION 3 — Équipements */}
        <SectionCard id="equipements" title="Équipements & Services">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Équipements</p>
            <CheckList
              items={amenities}
              selected={form.amenity_ids || []}
              onChange={v => setF('amenity_ids', v)}
            />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</p>
            <CheckList
              items={services}
              selected={form.service_ids || []}
              onChange={v => setF('service_ids', v)}
            />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Conditions de réservation</p>
            <CheckList
              items={bookingConds}
              selected={form.booking_condition_ids || []}
              onChange={v => setF('booking_condition_ids', v)}
            />
          </div>
        </SectionCard>

        {/* SECTION 4 — Photos */}
        <SectionCard id="photos" title="Photos de votre propriété">
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-xs text-amber-700">
            Vos photos seront vérifiées par HWS avant publication sur le site.
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{(form.image_urls || []).length} photo(s)</p>
            <label className="cursor-pointer">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg cursor-pointer"
                style={{ background: '#8B1A1A' }}>
                <Plus className="w-4 h-4" />
                Envoyer des photos
              </span>
            </label>
          </div>
          {(form.image_urls || []).length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune photo — ajoutez des photos pour compléter votre fiche</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(form.image_urls || []).map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square">
                  <img src={url} alt={`photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-white/90 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                      Principale
                    </span>
                  )}
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Save button */}
        <div className="sticky bottom-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
            {saved ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Modifications transmises à HWS !</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Elles apparaîtront sur le site centraledesriads.com sous 48h.
                  </p>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full h-11 text-base font-semibold text-white"
                style={{ background: '#8B1A1A' }}
              >
                {saveMutation.isPending ? 'Envoi en cours…' : '💾 Enregistrer mes modifications'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}