import React from 'react';
import { useTelegram } from '../../hooks/useTelegram';

export const Home: React.FC = () => {
  const { user } = useTelegram();

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#fafafa' }}>
      {user && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          padding: '4px 16px 4px 4px',
          fontSize: 17,
          fontWeight: 500,
          color: '#222',
          maxWidth: 240
        }}>
          <img
            src={user.photo_url}
            alt={user.first_name}
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 10 }}
          />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.first_name}{user.last_name ? ` ${user.last_name}` : ''}
          </span>
        </div>
      )}
      <div style={{ paddingTop: 80, textAlign: 'center' }}>Home</div>
    </div>
  );
}; 