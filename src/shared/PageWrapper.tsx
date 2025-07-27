import React, { useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';

interface PageProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
}

export const PageWrapper: React.FC<PageProps> = ({ children, showBackButton = false}) => {
  const { tg } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    // Устанавливаем цвет заголовка
    tg.setHeaderColor('#ffffff');
    
    if (showBackButton) {
      tg.BackButton.show();
      const handleBack = () => {
        navigate('/home');
      };
      tg.BackButton.onClick(handleBack);
      
      return () => {
        tg.BackButton.offClick(handleBack);
      };
    } else {
      tg.BackButton.hide();
    }

    // Очистка при размонтировании
    return () => {
      // tg.MainButton.hide(); // Закомментировано, так как MainButton может не использоваться
    };
  }, [showBackButton, navigate, tg]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f8f8'
    }}>
      {children}
    </div>
  );
};