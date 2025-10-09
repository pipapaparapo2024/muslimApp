import React, { useEffect, type CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const tg = window.Telegram?.WebApp;
  // useEffect(() => {
  //   const initializeApp = async () => {
  //     try {
  //       localStorage.setItem("appInitialized", "true");
  //     } catch (error) {
  //       console.error("Initialization error:", error);
  //     }
  //   };

  //   initializeApp();
  // }, []);
  const handleBack = () => {
    navigate(navigateTo);
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  useEffect(() => {
    if (!tg) return;

    tg.ready();

    // Настройка SettingsButton
    if (tg.SettingsButton) {
      tg.SettingsButton.show();
      tg.SettingsButton.onClick(handleSettings);
    }

    // Настройка BackButton
    if (showBackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    // Очистка при размонтировании
    return () => {
      if (tg.SettingsButton) {
        tg.SettingsButton.offClick(handleSettings);
      }
      if (showBackButton) {
        tg.BackButton.offClick(handleBack);
        tg.BackButton.hide();
      }
    };
  }, [showBackButton, navigateTo, tg, location.pathname]);

  const containerStyle: CSSProperties = styleHave
    ? {
        backgroundColor: "var(--bg-app)",
        position: "relative",
        margin: "0 auto",
        padding: "12px 16px",
        maxWidth: "410px",
        width: "100%",
        lineHeight: "20px",
        boxSizing: "border-box",
        letterSpacing: "-0.24px",
      }
    : {};

  return <div style={containerStyle}>{children}</div>;
};
