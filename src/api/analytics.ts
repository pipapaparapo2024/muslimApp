import { quranApi } from "./api";

const getSessionId = (): string => {
  if (!sessionStorage.getItem("telegram_session_id")) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36)}`;
    sessionStorage.setItem("telegram_session_id", sessionId);
  }
  return sessionStorage.getItem("telegram_session_id")!;
};

const getTelegramUserId = (): string | number | null => {
  const user = window?.Telegram?.WebApp?.initDataUnsafe?.user;
  return user?.id || null;
};

export const trackButtonClick = async (
  eventType: string,
  eventName: string,
  payload?: {}
) => {
  const userId = getTelegramUserId();
  const sessionId = getSessionId();

  if (window?.Telegram?.WebApp?.trackEvent) {
    try {
      window.Telegram.WebApp.trackEvent(eventType, {
        eventName: eventName,
        eventTimestamp: new Date().toISOString(),
        eventType: eventType,
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        payload: payload,
        sessionId: sessionId,
        userId: userId,
      });
    } catch (err) {
      console.warn("⚠️ Ошибка при отправке в Telegram аналитику:", err);
    }
  }

  const eventData = {
    eventName,
    eventTimestamp: new Date().toISOString(),
    eventType,
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    payload: payload ? JSON.stringify(payload) : "{}", 
    sessionId,
    userId: userId ?? 0,
  };

  try {
    const response = await quranApi.post("/api/v1/analytics/set", eventData);
    console.log("✅ Аналитика отправлена:", eventData);
    return response.data;
  } catch (error) {
    console.error("❌ Ошибка при отправке аналитики:", error);
  }
};
