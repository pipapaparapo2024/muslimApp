import React, { useEffect } from "react";
// import { useTelegram } from "../api/useTelegram";
import { useNavigate } from "react-router-dom";

interface PageProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
}

export const PageWrapper: React.FC<PageProps> = ({
  children,
  showBackButton = false,
}) => {
  const navigate = useNavigate();
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    console.log("Initializing PageWrapper, showBackButton:", showBackButton);
    tg.ready();
    tg.setHeaderColor("#ffffff");

    // Инициализация кнопки настроек
    if (tg.SettingsButton) {
      tg.SettingsButton.show();
      const handleSettings = () => navigate("/settings");
      tg.SettingsButton.onClick(handleSettings);
    }

    // Инициализация кнопки "Назад"
    if (showBackButton) {
      tg.BackButton.show();
      const handleBack = () => navigate("/home");
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    // Функция очистки
    return () => {
      console.log("Cleaning up buttons");
      if (tg.SettingsButton) {
        tg.SettingsButton.offClick();
        tg.SettingsButton.hide();
      }
      if (showBackButton) {
        tg.BackButton.offClick();
        tg.BackButton.hide();
      }
    };
  }, [showBackButton, navigate, tg]);

  return (
    <div
      style={{
        backgroundColor: "var(--bg-app)",
        position: "relative",
        margin: "0 auto",
        padding: "16px 16px 0 16px",
        maxWidth: "420px",
      }}
    >
      {children}
    </div>
  );
};
