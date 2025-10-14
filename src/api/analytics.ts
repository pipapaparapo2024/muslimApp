import { quranApi } from "./api";
import { useTelegram } from "../hooks/useTelegram";
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

const getEventId = (): string => {
  const now = Date.now();
  const baseDate = new Date("2025-01-01T00:00:00Z").getTime();
  const delta = now - baseDate;

  const lastDate = sessionStorage.getItem("event_counter_date");
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  let counter = 0;

  if (lastDate === todayStr) {
    counter = Number(sessionStorage.getItem("event_counter") || 0);
  }

  counter += 1;
  sessionStorage.setItem("event_counter", counter.toString());
  sessionStorage.setItem("event_counter_date", todayStr);

  return `evt_${delta}_${counter}`;
};

export const trackButtonClick = async (
  eventType: string,
  eventName: string,
  payload?: Record<string, any>
) => {
  const userId = getTelegramUserId();
  const sessionId = getSessionId();
  const eventId = getEventId();
  const {promo} = useTelegram();
  if (window?.Telegram?.WebApp?.trackEvent) {
    try {
      window.Telegram.WebApp.trackEvent(eventType, {
        eventName,
        eventTimestamp: new Date().toISOString(),
        eventType,
        id: eventId,
        payload,
        sessionId,
        userId,
      });
    } catch (err) {
      console.warn("⚠️ Ошибка при отправке в Telegram аналитику:", err);
    }
  }

  const eventData = {
    eventName,
    eventTimestamp: new Date().toISOString(),
    eventType,
    id: eventId,
    payload: payload ?? {},
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
