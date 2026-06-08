import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import { insertProperty, insertContact } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '@/i18n';

const CITIES = [
  { id: "essaouira", label: "Essaouira" },
  { id: "marrakech", label: "Marrakech" },
  { id: "ouarzazate", label: "Ouarzazate" },
];

const NEIGHBORHOODS = [
  { id: "agdal", label: "Agdal" },
  { id: "bab_doukkala", label: "Bab Doukkala" },
  { id: "ben_youssef", label: "Ben Youssef" },
  { id: "dar_el_bacha", label: "Dar El Bacha" },
  { id: "derb_dabachi", label: "Derb Dabachi" },
  { id: "derb_sidi_bou_amar", label: "Derb Sidi Bou Amar" },
  { id: "desert", label: "Désert" },
  { id: "essaouira_exterieurs", label: "Essaouira Extérieurs" },
  { id: "essaouira_medina", label: "Essaouira Médina" },
  { id: "exterior", label: "Extérieur" },
  { id: "gueliz", label: "Guéliz" },
  { id: "hay_essalam", label: "Hay Essalam" },
  { id: "kasbah", label: "Kasbah" },
  { id: "kennaria", label: "Kennaria" },
  { id: "mellah", label: "Mellah" },
  { id: "montagne", label: "Montagne" },
  { id: "mouassine", label: "Mouassine" },
  { id: "ouarzazate_exterieurs", label: "Ouarzazate Extérieurs" },
  { id: "palmeraie", label: "Palmeraie" },
  { id: "rahba_kedina", label: "Rahba Kedina" },
  { id: "riad_laarous", label: "Riad Laarous" },
  { id: "sidi_ben_slimane", label: "Sidi Ben Slimane" },
  { id: "zitoun", label: "Zitoun" },
];

const PROPERTY_TYPES = [
  { id: "guesthouse", label: "Maison d'hôte" },
  { id: "kasbah", label: "Kasbah" },
  { id: "riad", label: "Riad" },
];

export default function AddRiad() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    // mgh_properties_final fields
    name_fr: '',
    city_id: '',
    neighborhood_id: '',
    address_fr: '',
    longitude: '',
    latitude: '',
    website: '',
    phone: '',           // reservation phone — visible on site
    email: '',           // mgh_properties_final.email — reservation email, visible on site
    property_type_id: '',
    // mgh_contacts fields
    contactname: '',
    access_email: '',    // mgh_contacts.email — platform access email, private
    CM: '',              // mgh_contacts.CM
    membershipstatus: true,
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));



  const lngVal = parseFloat(form.longitude);
  const lngWarning = form.longitude !== '' && !isNaN(lngVal) && lngVal > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const id = uuidv4();
      // mgh_properties_final — flat longitude/latitude columns
      const propertyData = {
        id,
        name: { fr: form.name_fr, en: form.name_fr, es: form.name_fr },
        city_id: form.city_id,
        neighborhood_id: form.neighborhood_id || null,
        address: { fr: form.address_fr, en: form.address_fr, es: form.address_fr },
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        website: form.website,
        phone: form.phone,
        email: form.email,  // reservation email
        property_type_id: form.property_type_id || null,
      };
      // mgh_contacts — exact column names
      const contactData = {
        property_id: id,             // FK to mgh_properties_final.id
        contactname: form.contactname,
        email: form.access_email,  // platform access email (private)
        CM: form.CM,
        membershipstatus: form.membershipstatus,
        riadname: form.name_fr,
      };
      await insertProperty(propertyData);
      await insertContact(contactData);
      return id;
    },
    onSuccess: (id) => {
      toast({ title: t('addRiad.riadAdded') });
      navigate(`/properties/${id}`);
    },
    onError: (err) => {
      toast({ title: `Erreur: ${err.message}`, variant: 'destructive' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name_fr) {
      toast({ title: t('addRiad.nameRequired'), variant: 'destructive' });
      return;
    }
    if (lngWarning) {
      toast({ title: t('addRiad.longitudeNegative'), variant: 'destructive' });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('addRiad.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('addRiad.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos propriété — mgh_properties_final */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50 pb-2">
            {t('addRiad.propertyInfo')} <span className="text-muted-foreground normal-case font-normal">{t('addRiad.propertyInfoTable')}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.nameFr')} <span className="text-red-500">*</span></label>
              <Input value={form.name_fr} onChange={e => setField('name_fr', e.target.value)} placeholder="Ex: Riad Zitoun" required />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.propertyType')}</label>
              <Select value={form.property_type_id} onValueChange={v => setField('property_type_id', v)}>
                <SelectTrigger><SelectValue placeholder={t('addRiad.selectPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(pt => <SelectItem key={pt.id} value={pt.id}>{pt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.city')}</label>
              <Select value={form.city_id} onValueChange={v => { setField('city_id', v); setField('neighborhood_id', ''); }}>
                <SelectTrigger><SelectValue placeholder={t('addRiad.selectPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.neighborhood')}</label>
              <Select value={form.neighborhood_id} onValueChange={v => setField('neighborhood_id', v)} disabled={!form.city_id}>
                <SelectTrigger><SelectValue placeholder={form.city_id ? t('addRiad.selectPlaceholder') : t('addRiad.cityFirst')} /></SelectTrigger>
                <SelectContent>
                  {NEIGHBORHOODS.map(n => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.addressFr')}</label>
              <Input value={form.address_fr} onChange={e => setField('address_fr', e.target.value)} placeholder="Ex: 5 Derb Zitoun El Kebir, Medina" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.longitude')}</label>
              <Input
                type="number"
                step="any"
                value={form.longitude}
                onChange={e => setField('longitude', e.target.value)}
                placeholder="-7.989"
                className={lngWarning ? 'border-red-500' : ''}
              />
              {lngWarning && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {t('addRiad.longitudeNegative')}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.latitude')}</label>
              <Input type="number" step="any" value={form.latitude} onChange={e => setField('latitude', e.target.value)} placeholder="31.634" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.website')}</label>
              <Input value={form.website} onChange={e => setField('website', e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.reservationPhone')}</label>
              <Input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+212 …" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.reservationEmail')}</label>
              <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="reservations@riad.ma" />
              <p className="text-xs text-muted-foreground mt-1">{t('addRiad.reservationEmailHint')}</p>
            </div>
          </div>
        </div>

        {/* Contact & accès — mgh_contacts */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50 pb-2">
            {t('addRiad.contactAccess')} <span className="text-muted-foreground normal-case font-normal">{t('addRiad.contactAccessTable')}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.contactName')}</label>
              <Input value={form.contactname} onChange={e => setField('contactname', e.target.value)} placeholder="Prénom Nom" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                {t('addRiad.accessEmail')}
              </label>
              <Input type="email" value={form.access_email} onChange={e => setField('access_email', e.target.value)} placeholder="owner@email.com" />
              <p className="text-xs text-amber-600 mt-1">{t('addRiad.accessEmailHint')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.cm')}</label>
              <Input value={form.CM} onChange={e => setField('CM', e.target.value)} placeholder="Ex: Beds24, Cloudbeds…" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">{t('addRiad.membershipStatus')}</label>
              <Select value={String(form.membershipstatus)} onValueChange={v => setField('membershipstatus', v === 'true')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('addRiad.activeStatus')}</SelectItem>
                  <SelectItem value="false">{t('addRiad.inactiveStatus')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending} className="text-white px-8" style={{ background: '#384252' }}>
            {mutation.isPending ? t('addRiad.saving') : t('addRiad.addRiadBtn')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/properties')}>{t('common.cancel')}</Button>
        </div>
      </form>
    </div>
  );
}
