import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuBlocks.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../../hooks/useLanguages";
import { useTranslation } from "react-i18next"; // Добавьте этот импорт

// Импорты иконок
import Quaran from "../../../assets/icons/quaran1.svg";
import apple from "../../../assets/icons/Applee.svg";
import church from "../../../assets/icons/Churchh.svg";
import muslim from "../../../assets/icons/islam.svg";
import settings from "../../../assets/icons/setting.svg";

export const MenuBlocks: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useTranslation(); // Используем хук useTranslation

  // Массив menuItems теперь внутри компонента
  const menuItems = [
    {
      id: "quran",
      icon: Quaran,
      title: t("readQuran"), // Теперь t() вызывается при каждом рендере
      description: t("openAndRead"),
      path: "/quran",
    },
    {
      id: "qna",
      icon: church,
      title: t("askAboutFaith"),
      description: t("getAnswers"),
      path: "/qna",
    },
    {
      id: "scanner",
      icon: apple,
      title: t("foodScanner"),
      description: t("checkProduct"),
      path: "/scanner",
    },
    {
      id: "friends",
      icon: muslim,
      title: t("friends"),
      description: t("shareApp"),
      path: "/welcome-friends",
    },
    {
      id: "settings",
      icon: settings,
      title: t("settings"),
      description: t("selectSettings"),
      path: "/settings",
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className={styles.menu}>
      {menuItems.map((item) => (
        <div
          key={item.id}
          className={styles.menuItem}
          onClick={() => handleNavigation(item.path)}
        >
          <img src={item.icon} alt={item.title} className={styles.iconImage} />
          <div className={styles.menuText}>
            <div className={styles.menuTitle}>{item.title}</div>
            <div className={styles.menuDesc}>{item.description}</div>
          </div>
          {language === "ar" ? (
            <ChevronLeft size={24} />
          ) : (
            <ChevronRight size={24} />
          )}
        </div>
      ))}
    </div>
  );
};