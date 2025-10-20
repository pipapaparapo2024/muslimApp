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
  payload?: string | Record<string, any>
) => {
  const userId = getTelegramUserId();
  const sessionId = getSessionId();
  const eventId = getEventId();
  if (window?.Telegram?.WebApp?.trackEvent) {
    try {
      window.Telegram.WebApp.trackEvent(eventType, {
        Id: eventId,
        UserId: userId,
        SessionId: sessionId,
        EventType: eventType,
        EventName: eventName,
        EventTimestamp: new Date().toISOString(),
        Payload: payload,
      });
    } catch (err) {
      console.warn("⚠️ Ошибка при отправке в Telegram аналитику:", err);
    }
  }

  const eventData = {
    Id: eventId,
    UserId: userId,
    SessionId: sessionId,
    EventType: eventType,
    EventName: eventName,
    EventTimestamp: new Date().toISOString(),
    Payload: payload,
  };

  try {
    const response = await quranApi.post("/api/v1/analytics/set", eventData);
    console.log("✅ Аналитика отправлена:", eventData);
    return response.data;
  } catch (error) {
    console.error("❌ Ошибка при отправке аналитики:", error);
  }
};
