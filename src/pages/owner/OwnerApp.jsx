import React, { useState, useEffect } from 'react';
import OwnerDashboard from './OwnerDashboard';
import PropertySelector from './PropertySelector';
import { useNavigate } from 'react-router-dom';

export default function OwnerApp() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mgh_owner_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.expiresAt && Date.now() < s.expiresAt) {
          setSession(s);
          return;
        } else {
          localStorage.removeItem('mgh_owner_session');
        }
      }
    } catch {
      localStorage.removeItem('mgh_owner_session');
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    if (checked && !session) navigate('/portal');
  }, [checked, session, navigate]);

  if (!checked || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5F5' }}>
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-primary" />
      </div>
    );
  }

  const handleLogout = () => { setSession(null); navigate('/portal'); };

  const handlePropertySelect = (contact) => {
    const updated = { ...session, propertyId: contact.property_id, contactName: contact.contactname };
    setSession(updated);
    localStorage.setItem('mgh_owner_session', JSON.stringify(updated));
  };

  const handleBackToSelector = () => {
    const updated = { ...session, propertyId: undefined };
    setSession(updated);
    localStorage.setItem('mgh_owner_session', JSON.stringify(updated));
  };

  if (session.multipleProperties && !session.propertyId) {
    return (
      <PropertySelector
        session={session}
        onSelect={handlePropertySelect}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <OwnerDashboard
      session={session}
      onLogout={handleLogout}
      onBackToProperties={session.multipleProperties ? handleBackToSelector : null}
    />
  );
}