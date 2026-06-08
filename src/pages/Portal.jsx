import React, { useState } from 'react';
import { listContacts } from '@/lib/api';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Shield, Users, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function HwsLoginForm() {
  return (
    <div className="space-y-4">
      <div className="bg-slate-500/10 border border-slate-500/20 rounded-lg px-4 py-3 text-sm text-slate-700">
        L'équipe HWS se connecte via le bouton "Se connecter" en haut à droite de la page, 
        avec vos identifiants Base44 habituels.
      </div>
      <Button
        onClick={() => base44.auth.redirectToLogin(window.location.origin + '/')}
        className="w-full h-10 text-white font-semibold"
        style={{ background: '#384252' }}
      >
        Connexion HWS →
      </Button>
    </div>
  );
}

function DirectorLoginForm({ onSuccess }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [directorData, setDirectorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('lookupDirector', { email });
      if (!res.data?.found) {
        setError('Email non reconnu ou rôle insuffisant pour cette section.');
        setLoading(false);
        return;
      }
      const match = res.data;
      const code = generateOTP();
      setGeneratedOtp(code);
      setOtpExpiry(Date.now() + 10 * 60 * 1000);
      setDirectorData(match);
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Votre code de connexion MGH Direction',
        body: `Bonjour ${match.full_name || ''},\n\nVotre code de connexion au Dashboard Direction MGH est :\n\n${code}\n\nCe code est valide pendant 10 minutes.\n\nHospitality Web Services`,
      });
      setStep('otp');
    } catch (err) {
      setError('Erreur lors de la vérification. Réessayez.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');
    if (Date.now() > otpExpiry) { setError('Code expiré. Recommencez.'); setStep('email'); return; }
    if (otp.trim() !== generatedOtp) { setError('Code incorrect.'); return; }
    const session = {
      email: directorData.email,
      name: directorData.full_name || 'Direction MGH',
      role: 'mgh_director',
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };
    localStorage.setItem('mgh_director_session', JSON.stringify(session));
    onSuccess();
  };

  if (step === 'email') {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-1">Email Direction MGH</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="direction@mgh.com" />
          <p className="text-xs text-muted-foreground mt-1">Un code à 6 chiffres vous sera envoyé par email</p>
        </div>
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}
        <Button type="submit" disabled={loading || !email} className="w-full h-10 text-white font-semibold" style={{ background: '#384252' }}>
          {loading ? 'Vérification…' : '📨 Recevoir mon code →'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-center">
        <p className="text-sm text-primary">📨 Code envoyé à <strong>{email}</strong></p>
        <p className="text-xs text-muted-foreground mt-1">Vérifiez votre boîte mail — valide 10 minutes</p>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-1">Code à 6 chiffres</label>
        <Input
          type="text" inputMode="numeric" maxLength={6}
          value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456" autoFocus
          className="text-center text-xl tracking-[0.3em] font-bold h-12"
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}
      <Button type="submit" disabled={otp.length !== 6} className="w-full h-10 text-white font-semibold" style={{ background: '#384252' }}>
        Accéder au dashboard Direction →
      </Button>
      <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }}
        className="w-full text-center text-xs text-muted-foreground hover:text-muted-foreground underline">
        ← Utiliser un autre email
      </button>
    </form>
  );
}

function OwnerLoginForm({ onSuccess }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('ownerLogin', { email });
      if (!res.data?.found) {
        setError('Email non reconnu. Contactez HWS : info@hospitalitywebservices.com');
        setLoading(false);
        return;
      }
      const match = res.data;
      const code = generateOTP();
      setGeneratedOtp(code);
      setOtpExpiry(Date.now() + 10 * 60 * 1000);
      setContactData(match);
      await base44.functions.invoke('ownerLogin', {
        email,
        code,
        contactname: match.contactname || '',
      });
      setStep('otp');
    } catch {
      setError('Erreur lors de la vérification. Réessayez.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');
    if (Date.now() > otpExpiry) { setError('Code expiré. Recommencez.'); setStep('email'); return; }
    if (otp.trim() !== generatedOtp) { setError('Code incorrect.'); return; }

    const contacts = contactData.contacts || [];
    const isMulti = contacts.length > 1;

    const session = {
      email,
      contactName: contactData.contactname,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      // If only one property, set it directly; otherwise let PropertySelector handle it
      ...(isMulti
        ? { multipleProperties: true, contacts }
        : { propertyId: contacts[0]?.property_id }),
    };
    localStorage.setItem('mgh_owner_session', JSON.stringify(session));
    onSuccess();
  };

  if (step === 'email') {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-1">Votre email de connexion</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="votre@email.com" />
          <p className="text-xs text-muted-foreground mt-1">L'email fourni à HWS lors de votre adhésion</p>
        </div>
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}
        <Button type="submit" disabled={loading || !email} className="w-full h-10 text-white font-semibold" style={{ background: '#384252' }}>
          {loading ? 'Vérification…' : '📨 Recevoir mon code →'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-center">
        <p className="text-sm text-primary">📨 Code envoyé à <strong>{email}</strong></p>
        <p className="text-xs text-muted-foreground mt-1">Vérifiez votre boîte mail — valide 10 minutes</p>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-1">Code à 6 chiffres</label>
        <Input
          type="text" inputMode="numeric" maxLength={6}
          value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456" autoFocus
          className="text-center text-xl tracking-[0.3em] font-bold h-12"
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}
      <Button type="submit" disabled={otp.length !== 6} className="w-full h-10 text-white font-semibold" style={{ background: '#384252' }}>
        Accéder à mon espace →
      </Button>
      <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }}
        className="w-full text-center text-xs text-muted-foreground hover:text-muted-foreground underline">
        ← Utiliser un autre email
      </button>
    </form>
  );
}

const TABS = [
  { key: 'hws', label: 'Équipe HWS', icon: Shield },
  { key: 'owner', label: 'Espace Propriétaire', icon: Building2 },
];

export default function Portal() {
  const [activeTab, setActiveTab] = useState('owner');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: '#F5F5F5' }}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden border border-border bg-muted shadow-sm">
          <span className="font-bold text-2xl text-primary">MGH</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Moroccan Guest Houses</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Plateforme de gestion HWS</p>
      </div>

      <div className="w-full max-w-md bg-card border border-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 px-1 text-xs font-medium transition-all border-b-2 -mb-px flex flex-col items-center gap-0.5 ${
                activeTab === t.key ? '' : 'border-transparent text-muted-foreground hover:text-muted-foreground'
              }`}
              style={activeTab === t.key ? { borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))' } : {}}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'hws' && <HwsLoginForm />}
          {activeTab === 'director' && <DirectorLoginForm onSuccess={() => navigate('/director')} />}
          {activeTab === 'owner' && <OwnerLoginForm onSuccess={() => navigate('/owner')} />}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Propulsé par{' '}
        <a href="https://hospitalitywebservices.com" target="_blank" rel="noreferrer" className="underline text-primary">
          Hospitality Web Services
        </a>
      </p>
    </div>
  );
}