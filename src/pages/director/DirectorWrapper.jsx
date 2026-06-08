import React, { useState, useEffect } from 'react';
import DirectorApp from './DirectorApp';
import { useNavigate } from 'react-router-dom';

export default function DirectorWrapper() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mgh_director_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.expiresAt && Date.now() < s.expiresAt) {
          setSession(s);
        } else {
          localStorage.removeItem('mgh_director_session');
        }
      }
    } catch {
      localStorage.removeItem('mgh_director_session');
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (checked && !session) {
      navigate('/portal');
    }
  }, [checked, session, navigate]);

  if (!checked || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5F5' }}>
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-primary" />
      </div>
    );
  }

  return <DirectorApp session={session} onLogout={() => { setSession(null); navigate('/portal'); }} />;
}