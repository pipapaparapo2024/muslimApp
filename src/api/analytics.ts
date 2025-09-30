const getSessionId = (): string => {
  if (!sessionStorage.getItem('telegram_session_id')) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('telegram_session_id', sessionId);
  }
  return sessionStorage.getItem('telegram_session_id')!;
};

const getTelegramUserId = (): string | number | null => {
  if (!window.Telegram?.WebApp) return null;
  
  const user = window.Telegram.WebApp.initDataUnsafe?.user;
  return user?.id || null;
};

export const trackButtonClick = (
  buttonName: string,
  additionalData: Record<string, unknown> = {}
) => {
  if (window.Telegram?.WebApp?.trackEvent) {
    const userId = getTelegramUserId();
    const sessionId = getSessionId();
    
    window.Telegram.WebApp.trackEvent('button_click', {
      button_name: buttonName,
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }
  
  console.log('Button tracked:', {
    event: 'button_click',
    button_name: buttonName,
    user_id: getTelegramUserId(),
    session_id: getSessionId(),
    ...additionalData
  });
};