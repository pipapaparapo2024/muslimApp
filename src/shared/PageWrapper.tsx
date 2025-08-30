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
  const handleSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate(navigateTo);
  }, [navigate, navigateTo]);

  useEffect(() => {
    if (!tg) return;

    tg.ready();

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
      if (tg.SettingsButton) {
        tg.SettingsButton.offClick(handleSettings);
        tg.SettingsButton.hide();
      }
      if (showBackButton) {
        tg.BackButton.offClick(handleBack);
        tg.BackButton.hide();
      }
    };
  }, [showBackButton, navigate, tg, navigateTo, handleSettings, handleBack]);

  const containerStyle: CSSProperties = styleHave
    ? {
        backgroundColor: "var(--bg-app)",
        position: "relative",
        margin: "0 auto",
        padding:"12px",
        maxWidth: "420px",
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
      }
    : {};

  return <div style={containerStyle}>{children}</div>;
  
};
