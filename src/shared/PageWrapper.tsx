import React, { useEffect, type CSSProperties } from "react";
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
      const handleSettings = () => navigate("/settings");
      tg.SettingsButton.onClick(handleSettings);
    }

    if (showBackButton) {
      tg.BackButton.show();
      const handleBack = () => navigate(navigateTo);
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

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
  }, [showBackButton, navigate, tg, navigateTo]);

  const containerStyle: CSSProperties = styleHave ? {
    backgroundColor: "var(--bg-app)",
    position: "relative",
    margin: "0 auto",
    padding: "16px 16px 0 16px",
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