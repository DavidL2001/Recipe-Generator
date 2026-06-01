import { useState, useEffect } from 'react';

export const OfflineBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div style={{
      background: '#c45252',
      color: '#fff',
      textAlign: 'center',
      padding: '8px 16px',
      fontSize: '0.85rem',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      zIndex: 9999,
      position: 'sticky',
      top: 0,
    }}>
      ⚠️ You're offline — changes won't be saved until you reconnect.
    </div>
  );
};
