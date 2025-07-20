import { useEffect } from 'react';
import  WebApp  from '@twa-dev/sdk';

export const useTelegram = () => {
  useEffect(() => {
    WebApp.ready(); // Сообщаем Telegram, что приложение готово
  }, []);

  return {
    tg: WebApp,
    user: WebApp.initDataUnsafe?.user,
  };
};