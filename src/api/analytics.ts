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
  if (!window.Telegram?.WebApp) return null;
  const user = window.Telegram.WebApp.initDataUnsafe?.user;
  return user?.id || null;
};

export const trackButtonClick = async (
  buttonName: string,
  additionalData: Record<string, unknown> = {}
) => {
  const userId = getTelegramUserId();
  const sessionId = getSessionId();

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
