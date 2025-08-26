import React, { useEffect, type CSSProperties, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface PageProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
  navigateTo?: string;
  styleHave?: boolean;
}

export const PageWrapper: React.FC<PageProps> = ({
  children,
  showBackButton = false,
  navigateTo = "/home",
  styleHave = true,
}) => {
  const navigate = useNavigate();
  const tg = window.Telegram?.WebApp;

  // Сохраняем callback-функции с useCallback
  const handleSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate(navigateTo);
  }, [navigate, navigateTo]);

  useEffect(() => {
    if (!tg) {
      console.warn("Telegram WebApp not available");
      return;
    }

    console.log("Initializing PageWrapper, showBackButton:", showBackButton);
    tg.ready();
    tg.setHeaderColor("#ffffff");

    if (tg.SettingsButton) {
      tg.SettingsButton.show();
      tg.SettingsButton.onClick(handleSettings);
    }

    if (showBackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      console.log("Cleaning up buttons");
      if (tg.SettingsButton) {
        // Передаем ту же самую функцию для удаления
        tg.SettingsButton.offClick(handleSettings);
        tg.SettingsButton.hide();
      }
      if (showBackButton) {
        // Передаем ту же самую функцию для удаления
        tg.BackButton.offClick(handleBack);
        tg.BackButton.hide();
      }
    };
  }, [showBackButton, navigate, tg, navigateTo, handleSettings, handleBack]);

  const containerStyle: CSSProperties = styleHave ? {
    backgroundColor: "var(--bg-app)",
    position: "relative",
    margin: "0 auto",
    padding: "12px",
    maxWidth: "420px",
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box"
  } : {};

  return (
    <div style={containerStyle}>
      {children}
    </div>
  );
};