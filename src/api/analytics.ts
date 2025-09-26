export const trackButtonClick = (
  buttonName: string,
  additionalData: Record<string, unknown> = {}
) => {
  if (window.Telegram?.WebApp?.trackEvent) {
    window.Telegram.WebApp.trackEvent('button_click', {
      button_name: buttonName,
      ...additionalData
    });
  }
};