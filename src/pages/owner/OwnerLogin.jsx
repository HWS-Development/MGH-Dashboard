import React, { useState } from 'react';
import { listContacts } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Mail, KeyRound } from 'lucide-react';

// Generates a random 6-digit code
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function OwnerLogin({ onLogin }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await listContacts({ limit: 500 });
      const contacts = result?.data || [];
      const matches = contacts.filter(c => c.login_email?.toLowerCase().trim() === email.toLowerCase().trim());
      if (matches.length === 0) {
        setError("Email non reconnu. Contactez HWS pour obtenir votre accès : info@hospitalitywebservices.com");
        setLoading(false);
        return;
      }
      const code = generateOTP();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      setGeneratedOtp(code);
      setOtpExpiry(expiry);
      // Store first match for name display; all matches stored for multi-property handling
      setContact({ ...matches[0], _allMatches: matches });

      const contactname = matches[0].contactname || matches[0].contact_name || 'Propriétaire';

      await base44.functions.invoke('sendOtpEmail', {
        to: email,
        contactname,
        code,
      });

      setStep('otp');
    } catch (err) {
      setError('Erreur lors de la vérification. Réessayez.');
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (Date.now() > otpExpiry) {
      setError('Code expiré. Veuillez recommencer.');
      setStep('email');
      return;
    }
    if (otp.trim() !== generatedOtp) {
      setError('Code incorrect. Vérifiez le code et réessayez.');
      return;
    }
    const allMatches = contact._allMatches || [contact];
    const session = {
      email: contact.login_email,
      contactName: contact.contactname || contact.contact_name,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8h session
      // Single property: set propertyId directly. Multiple: leave it unset for selector screen.
      ...(allMatches.length === 1
        ? { propertyId: allMatches[0].supabase_id }
        : { multipleProperties: true }
      ),
    };
    localStorage.setItem('mgh_owner_session', JSON.stringify(session));
    onLogin(session);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: '#f9f6f3' }}>
      {/* Logo area */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white font-bold text-xl mb-4" style={{ background: '#8B1A1A' }}>
          MGH
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Espace Propriétaire</h1>
        <p className="text-sm text-gray-500 mt-1">Maisons & Riads au Maroc</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 mb-2">
                <Mail className="w-5 h-5" style={{ color: '#8B1A1A' }} />
              </div>
              <h2 className="font-semibold text-gray-800 text-lg">Connexion propriétaire</h2>
              <p className="text-xs text-gray-400 mt-1">Entrez l'email fourni à HWS lors de votre adhésion</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email de connexion</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                autoFocus
                className="text-base"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full text-white h-11 text-base"
              style={{ background: '#8B1A1A' }}
            >
              {loading ? 'Vérification…' : 'Continuer →'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mb-2">
                <KeyRound className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="font-semibold text-gray-800 text-lg">Code de vérification</h2>
              <p className="text-xs text-gray-500 mt-1">Entrez le code reçu par email</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-blue-700">Un code a été envoyé à <strong>{email}</strong>.<br/>Vérifiez votre boîte mail (et vos spams).</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Code à 6 chiffres</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                autoFocus
                className="text-center text-2xl tracking-[0.3em] h-14 font-bold"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              disabled={otp.length !== 6}
              className="w-full text-white h-11 text-base"
              style={{ background: '#8B1A1A' }}
            >
              Accéder à mon espace →
            </Button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 underline"
            >
              ← Utiliser un autre email
            </button>
          </form>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Problème de connexion ?{' '}
        <a href="mailto:info@hospitalitywebservices.com" className="underline" style={{ color: '#8B1A1A' }}>
          Contactez HWS
        </a>
      </p>
    </div>
  );
}