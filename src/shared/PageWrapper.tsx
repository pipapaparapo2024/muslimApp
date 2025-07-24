import React, { useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';

interface PageProps {
  children: React.ReactNode;
  showBackButton?: boolean;
}

export const PageWrapper: React.FC<PageProps> = ({ children, showBackButton = false }) => {
  const { tg } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    tg.setHeaderColor('#ffffff');
    tg.MainButton.hide();

    if (showBackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigate('/home');
      });
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(() => navigate('/home'));
    };
  }, [showBackButton, navigate, tg]);

  return (
    <div style={{
      paddingTop: 16,
      minHeight: '100vh',
      backgroundColor: '#f8f8f8'
    }}>
      {children}
    </div>
  );
}; 