import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function DirectorLogin({ onLogin }) {
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
    onLogin(session);
  };

  if (step === 'email') {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white/70 block mb-1">Email Direction MGH</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="direction@mgh.com" />
          <p className="text-xs text-white/40 mt-1">Un code à 6 chiffres vous sera envoyé par email</p>
        </div>
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <Button type="submit" disabled={loading || !email} className="w-full h-10 text-white" style={{ background: '#384252' }}>
          {loading ? 'Vérification…' : '📨 Recevoir mon code →'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-center">
        <p className="text-sm text-primary">📨 Code envoyé à <strong>{email}</strong></p>
        <p className="text-xs text-white/40 mt-1">Vérifiez votre boîte mail — valide 10 minutes</p>
      </div>
      <div>
        <label className="text-sm font-medium text-white/70 block mb-1">Code à 6 chiffres</label>
        <Input
          type="text" inputMode="numeric" maxLength={6}
          value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456" autoFocus
          className="text-center text-xl tracking-[0.3em] font-bold h-12"
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <Button type="submit" disabled={otp.length !== 6} className="w-full h-10 text-white" style={{ background: '#384252' }}>
        Accéder au dashboard Direction →
      </Button>
      <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }}
        className="w-full text-center text-xs text-white/40 hover:text-white/60 underline">
        ← Utiliser un autre email
      </button>
    </form>
  );
}