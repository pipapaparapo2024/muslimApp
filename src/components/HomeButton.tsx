import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';

const buttonStyle: React.CSSProperties = {
  position: 'fixed',
  top: 16,
  left: 16,
  zIndex: 1000,
  background: 'var(--tg-theme-button-color, #50a8eb)',
  color: 'var(--tg-theme-button-text-color, #fff)',
  border: 'none',
  borderRadius: 10,
  padding: '8px 14px',
  fontSize: 18,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
};

export const HomeButton: React.FC = () => {
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const handleBack = () => {
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        tg.close();
      });
    } else {
      navigate('/home');
    }
  };

  return (
    <button style={buttonStyle} onClick={handleBack}>
      ⬅️ Back
    </button>
  );
}; 