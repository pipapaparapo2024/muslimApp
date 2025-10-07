import { quranApi } from "./api";

const getSessionId = (): string => {
  if (!sessionStorage.getItem("telegram_session_id")) {
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    sessionStorage.setItem("telegram_session_id", sessionId);
  }
  return sessionStorage.getItem("telegram_session_id")!;
};

const getTelegramUserId = (): string | number | null => {
  const user = window?.Telegram?.WebApp?.initDataUnsafe?.user;
  return user?.id || null;
};

export const trackButtonClick = async (
  buttonName: string,
  additionalData: Record<string, unknown> = {}
) => {
  const userId = getTelegramUserId();
  const sessionId = getSessionId();

  if (window?.Telegram?.WebApp?.trackEvent) {
    try {
      window.Telegram.WebApp.trackEvent("button_click", {
        button_name: buttonName,
        user_id: userId,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        ...additionalData,
      });
    } catch (err) {
      console.warn("⚠️ Ошибка при отправке в Telegram аналитику:", err);
    }
  }

  const eventData = {
    eventName: buttonName,
    eventTimestamp: new Date().toISOString(),
    eventType: "button_click",
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    payload: JSON.stringify(additionalData),
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
