import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateProperty, getContact, updateContact,
  listCities, listPropertyTypes, listNeighborhoods,
  listAmenities, listServices, listBookingConditions
} from '@/lib/api';
import { usePartnerHotelById } from '@/lib/partnerHotelsApi';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, RefreshCw, AlertTriangle, X, Plus, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEFAULT_AMENITIES = [
  { id: 'wifi', name: 'WiFi' }, { id: 'pool', name: 'Piscine' }, { id: 'hammam', name: 'Hammam' },
  { id: 'spa', name: 'Spa' }, { id: 'air_conditioning', name: 'Climatisation' }, { id: 'parking', name: 'Parking' },
  { id: 'rooftop', name: 'Rooftop' }, { id: 'restaurant', name: 'Restaurant' },
  { id: 'baby_equipment', name: 'Équipement bébé' }, { id: 'safe', name: 'Coffre-fort' },
  { id: 'family_rooms', name: 'Chambres familiales' },
];

function FieldRow({ label, children, note }) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground block mb-1">{label}</label>
      {children}
      {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

function TextArea({ value, onChange, rows = 6, placeholder }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border border-input rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function CheckList({ items, selected = [], onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map(item => (
        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => toggle(item.id)}
            className="rounded"
          />
          <span className="text-sm text-muted-foreground">{item.name || item.label?.fr || item.id}</span>
        </label>
      ))}
    </div>
  );
}

export default function PropertyDetail() {
  const { id: propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(null);
  const [contact, setContact] = useState(null);
  const [translating, setTranslating] = useState(false);

  const { data: property, isLoading } = usePartnerHotelById(propertyId);

  const { data: contactData } = useQuery({
    queryKey: ['contact', propertyId],
    queryFn: () => getContact(propertyId),
    enabled: !!propertyId,
  });

  useEffect(() => {
    if (property && !form) setForm(JSON.parse(JSON.stringify(property)));
  }, [property]);

  useEffect(() => {
    if (contactData && !contact) setContact(JSON.parse(JSON.stringify(contactData)));
  }, [contactData]);

  const { data: citiesResult } = useQuery({ queryKey: ['cities'], queryFn: listCities });
  const { data: typesResult } = useQuery({ queryKey: ['property-types'], queryFn: listPropertyTypes });
  const { data: neighborhoodsResult } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => listNeighborhoods(),
  });
  const { data: amenitiesResult } = useQuery({ queryKey: ['amenities'], queryFn: listAmenities });
  const { data: servicesResult } = useQuery({ queryKey: ['services'], queryFn: listServices });
  const { data: bookingCondResult } = useQuery({ queryKey: ['booking-conditions'], queryFn: listBookingConditions });

  const cities = citiesResult?.data || [];
  const types = typesResult?.data || [];
  const neighborhoods = neighborhoodsResult?.data || [];
  const amenities = (amenitiesResult?.data?.length ? amenitiesResult.data : DEFAULT_AMENITIES);
  const services = servicesResult?.data || [];
  const bookingConds = bookingCondResult?.data || [];

  const setF = (path, value) => {
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

  const setC = (field, value) => setContact(prev => ({ ...prev, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateProperty(propertyId, form);
      if (contact) await updateContact(propertyId, contact);
      // Audit trail
      await base44.entities.pending_updates.create({
        property_id: propertyId,
        property_name: form?.name?.fr || propertyId,
        updated_by_email: user?.email || 'hws_admin',
        updated_at: new Date().toISOString(),
        status: 'approved',
        changes: { _hws_direct_save: { new_value: 'HWS direct edit' } },
        approved_by: user?.email || 'hws_admin',
        approved_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-hotel', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['contact', propertyId] });
      toast({ title: '✅ Saved to database' });
    },
    onError: (err) => toast({ title: `Erreur: ${err.message}`, variant: 'destructive' }),
  });

  const handleTranslate = async () => {
    const frText = form?.description?.fr;
    if (!frText) { toast({ title: 'Rédigez d\'abord la description FR', variant: 'destructive' }); return; }
    setTranslating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un traducteur professionnel spécialisé dans l'hôtellerie de luxe au Maroc.
Traduis la description suivante du français vers l'anglais ET vers l'espagnol.
Retourne UNIQUEMENT un JSON valide avec deux clés: "en" et "es".

Description FR:
${frText}`,
        response_json_schema: {
          type: 'object',
          properties: {
            en: { type: 'string' },
            es: { type: 'string' },
          },
        },
      });
      setF('description.en', result.en || '');
      setF('description.es', result.es || '');
      toast({ title: '✅ Traduction effectuée (EN + ES)' });
    } catch (e) {
      toast({ title: `Erreur traduction: ${e.message}`, variant: 'destructive' });
    } finally {
      setTranslating(false);
    }
  };

  const lngVal = parseFloat(form?.longitude);
  const lngWarning = form?.longitude !== undefined && form?.longitude !== '' && !isNaN(lngVal) && lngVal > 0;

  const removePhoto = (idx) => {
    const urls = [...(form?.image_urls || [])];
    urls.splice(idx, 1);
    setF('image_urls', urls);
  };

  const movePhoto = (idx, direction) => {
    const urls = [...(form?.image_urls || [])];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    [urls[idx], urls[newIdx]] = [urls[newIdx], urls[idx]];
    setF('image_urls', urls);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 800 * 1024; // 800KB
    let uploadCount = 0;
    for (const file of files) {
      if (file.size > maxSize) {
        toast({ title: `⚠️ ${file.name} dépasse 800KB — ignoré`, variant: 'destructive' });
        continue;
      }
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({
        ...prev,
        image_urls: [...(prev.image_urls || []), file_url],
      }));
      uploadCount++;
    }
    if (uploadCount > 0) toast({ title: `✅ ${uploadCount} photo(s) ajoutée(s)` });
  };

  if (isLoading || !form) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/properties')} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{form.name?.fr || form.name || 'Propriété'}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">ID: {propertyId}</p>
          </div>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="text-white flex items-center gap-2"
          style={{ background: '#384252' }}
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-muted flex flex-wrap gap-0 h-auto p-1">
          {[
            { value: 'general', label: 'Général' },
            { value: 'descriptions', label: 'Descriptifs' },
            { value: 'amenities', label: 'Équipements' },
            { value: 'photos', label: 'Photos' },
            { value: 'contact', label: 'Contact & Accès' },
            { value: 'membership', label: 'Adhésion MGH' },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs px-3 py-1.5 data-[state=active]:bg-primary/15 data-[state=active]:shadow-sm">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* TAB 1 — Général */}
        <TabsContent value="general" className="bg-card border border-border rounded-lg p-6 space-y-5 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldRow label="Nom FR">
              <Input value={form.name?.fr || ''} onChange={e => setF('name.fr', e.target.value)} />
            </FieldRow>
            <FieldRow label="Nom EN">
              <Input value={form.name?.en || ''} onChange={e => setF('name.en', e.target.value)} />
            </FieldRow>
            <FieldRow label="Nom ES">
              <Input value={form.name?.es || ''} onChange={e => setF('name.es', e.target.value)} />
            </FieldRow>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Type de propriété">
              <Select value={form.property_type_id || ''} onValueChange={v => setF('property_type_id', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t.id} value={t.id}>{t.label?.fr || t.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Ville">
              <Select value={form.city_id || ''} onValueChange={v => setF('city_id', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {cities.map(c => <SelectItem key={c.id} value={c.id}>{c.label?.fr || c.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Quartier">
              <Select value={form.neighborhood_id || ''} onValueChange={v => setF('neighborhood_id', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {neighborhoods.map(n => <SelectItem key={n.id} value={n.id}>{n.label?.fr || n.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Adresse FR">
              <Input value={form.address?.fr || ''} onChange={e => setF('address.fr', e.target.value)} />
            </FieldRow>
            <FieldRow label="GPS Longitude">
              <Input
                type="number"
                step="any"
                value={form.longitude ?? ''}
                onChange={e => setF('longitude', e.target.value === '' ? '' : parseFloat(e.target.value))}
                className={lngWarning ? 'border-red-500' : ''}
              />
              {lngWarning && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> La longitude doit être négative pour le Maroc
                </p>
              )}
            </FieldRow>
            <FieldRow label="GPS Latitude">
              <Input
                type="number"
                step="any"
                value={form.latitude ?? ''}
                onChange={e => setF('latitude', e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </FieldRow>
            <FieldRow label="Website">
              <Input value={form.website || ''} onChange={e => setF('website', e.target.value)} placeholder="https://…" />
            </FieldRow>
            <FieldRow label="Téléphone de réservation (visible sur le site)">
              <Input value={form.phone || ''} onChange={e => setF('phone', e.target.value)} />
            </FieldRow>
            <FieldRow label="Email de réservation (visible sur le site)">
              <Input type="email" value={form.email || ''} onChange={e => setF('email', e.target.value)} />
            </FieldRow>
            <FieldRow label="Note moyenne">
              <Input type="number" step="0.1" value={form.rating_avg ?? ''} onChange={e => setF('rating_avg', parseFloat(e.target.value))} />
            </FieldRow>
            <FieldRow label="Nombre d'avis">
              <Input type="number" value={form.reviews_count ?? ''} onChange={e => setF('reviews_count', parseInt(e.target.value))} />
            </FieldRow>
          </div>
          <FieldRow
            label="Simple Booking Link (HWS uniquement)"
            note="Renseigné par HWS après signature contrat — non visible au propriétaire"
          >
            <Input
              value={form.simple_booking_link || ''}
              onChange={e => setF('simple_booking_link', e.target.value)}
              placeholder="https://live.ipms247.com/…"
              className="border-amber-300 focus:ring-amber-400"
            />
          </FieldRow>
        </TabsContent>

        {/* TAB 2 — Descriptifs */}
        <TabsContent value="descriptions" className="bg-card border border-border rounded-lg p-6 space-y-5 mt-3">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleTranslate}
              disabled={translating}
              className="flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${translating ? 'animate-spin' : ''}`} />
              {translating ? 'Traduction en cours…' : '🔄 Traduire FR → EN + ES automatiquement'}
            </Button>
          </div>
          <FieldRow label="Description FR">
            <TextArea value={form.description?.fr} onChange={v => setF('description.fr', v)} rows={7} placeholder="Description en français…" />
          </FieldRow>
          <FieldRow label="Description EN">
            <TextArea value={form.description?.en} onChange={v => setF('description.en', v)} rows={7} placeholder="Description in English…" />
          </FieldRow>
          <FieldRow label="Description ES">
            <TextArea value={form.description?.es} onChange={v => setF('description.es', v)} rows={7} placeholder="Descripción en español…" />
          </FieldRow>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldRow label="Infos supplémentaires FR">
              <TextArea value={form.extra_info?.fr} onChange={v => setF('extra_info.fr', v)} rows={4} />
            </FieldRow>
            <FieldRow label="Infos supplémentaires EN">
              <TextArea value={form.extra_info?.en} onChange={v => setF('extra_info.en', v)} rows={4} />
            </FieldRow>
            <FieldRow label="Infos supplémentaires ES">
              <TextArea value={form.extra_info?.es} onChange={v => setF('extra_info.es', v)} rows={4} />
            </FieldRow>
          </div>
        </TabsContent>

        {/* TAB 3 — Équipements */}
        <TabsContent value="amenities" className="bg-card border border-border rounded-lg p-6 space-y-6 mt-3">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Équipements</h3>
            <CheckList
              items={amenities}
              selected={form.amenity_ids || []}
              onChange={v => setF('amenity_ids', v)}
            />
          </div>
          {services.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Services</h3>
              <CheckList
                items={services}
                selected={form.service_ids || []}
                onChange={v => setF('service_ids', v)}
              />
            </div>
          )}
          {bookingConds.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Conditions de réservation</h3>
              <CheckList
                items={bookingConds}
                selected={form.booking_condition_ids || []}
                onChange={v => setF('booking_condition_ids', v)}
              />
            </div>
          )}
        </TabsContent>

        {/* TAB 4 — Photos */}
        <TabsContent value="photos" className="bg-card border border-border rounded-lg p-6 space-y-5 mt-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Photos ({(form.image_urls || []).length}/20)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Max 20 photos, 800KB par photo. La 1ère = principale. Réordonnez avec ↑↓</p>
            </div>
            <label className="cursor-pointer">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                style={{background: (form.image_urls || []).length >= 20 ? '#ccc' : '#384252'}}
                disabled={(form.image_urls || []).length >= 20}>
                <Plus className="w-4 h-4" />
                Ajouter photos
              </span>
            </label>
          </div>
          {(form.image_urls || []).length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
              Aucune photo — cliquez sur "Ajouter photos"
            </div>
          ) : (
            <div className="space-y-2">
              {(form.image_urls || []).map((url, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors">
                  <img src={url} alt={`photo ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1 text-sm">
                    <p className="text-muted-foreground font-medium">Photo {idx + 1}</p>
                    {idx === 0 && <p className="text-xs text-amber-600">★ Principale</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx > 0 && (
                      <button onClick={() => movePhoto(idx, 'up')} className="p-1.5 hover:bg-muted rounded" title="Monter">
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    {idx < (form.image_urls || []).length - 1 && (
                      <button onClick={() => movePhoto(idx, 'down')} className="p-1.5 hover:bg-muted rounded" title="Descendre">
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={() => removePhoto(idx)}
                      className="p-1.5 hover:bg-red-500/15 rounded text-red-600"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 5 — Contact & Accès */}
        <TabsContent value="contact" className="bg-card border border-border rounded-lg p-6 space-y-5 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Nom du contact (contactname)">
              <Input value={contact?.contactname || ''} onChange={e => setC('contactname', e.target.value)} />
            </FieldRow>
            <FieldRow label="Email d'accès plateforme — géré dans Membres MGH (mgh_contacts.email)">
              <Input
                value={contact?.email || ''}
                readOnly
                disabled
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-amber-600 mt-1">⚠ Non modifiable ici. Utilisez la page Membres MGH pour changer cet email.</p>
            </FieldRow>
            <FieldRow label="Téléphone propriétaire (Telephone)">
              <Input value={contact?.Telephone || ''} onChange={e => setC('Telephone', e.target.value)} />
            </FieldRow>
            <FieldRow label="Channel Manager (CM)">
              <Input value={contact?.CM || ''} onChange={e => setC('CM', e.target.value)} />
            </FieldRow>
          </div>
        </TabsContent>

        {/* TAB 6 — Adhésion MGH */}
        <TabsContent value="membership" className="bg-card border border-border rounded-lg p-6 space-y-5 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Membre depuis (Membersince)">
              <Input type="date" value={contact?.Membersince || ''} onChange={e => setC('Membersince', e.target.value)} />
            </FieldRow>
            <FieldRow label="Date renouvellement">
              <Input type="date" value={contact?.renewaldate || ''} onChange={e => setC('renewaldate', e.target.value)} />
            </FieldRow>
            <FieldRow label="Statut adhésion">
              <Select value={contact?.membershipstatus || ''} onValueChange={v => setC('membershipstatus', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="ex-member">Ex-membre</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Type d'adhésion">
              <Input value={contact?.membershiptype || ''} onChange={e => setC('membershiptype', e.target.value)} placeholder="Ex: Standard, Premium…" />
            </FieldRow>
          </div>
          <FieldRow label="Notes internes HWS" note="Ces notes ne sont jamais visibles par le propriétaire du riad">
            <TextArea
              value={contact?.mghnotes}
              onChange={v => setC('mghnotes', v)}
              rows={5}
              placeholder="Notes internes, remarques HWS…"
            />
          </FieldRow>
        </TabsContent>
      </Tabs>
    </div>
  );
}