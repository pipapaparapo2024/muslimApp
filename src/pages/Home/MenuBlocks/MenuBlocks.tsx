import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuBlocks.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../../hooks/useLanguages";
import { useTranslation } from "react-i18next";
import { useFriendsStore } from "../../../hooks/useFriendsStore";
import { trackButtonClick } from "../../../api/global"

// Импорты иконок
import Quaran from "../../../assets/icons/quaran1.svg";
import apple from "../../../assets/icons/Applee.svg";
import church from "../../../assets/icons/Churchh.svg";
import muslim from "../../../assets/icons/islam.svg";
import settings from "../../../assets/icons/setting.svg";

export const MenuBlocks: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { friends, fetchFriends } = useFriendsStore();
  
  useEffect(() => {
    fetchFriends();
  }, []);

  const menuItems = [
    {
      id: "quran",
      icon: Quaran,
      title: t("readQuran"),
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
      path: friends.length > 0 ? "/friends" : "/welcomeFriends",
    },
    {
      id: "settings",
      icon: settings,
      title: t("settings"),
      description: t("selectSettings"),
      path: "/settings",
    },
  ];

  const handleNavigation = (itemId: string, path: string) => {
    // 📊 Аналитика: Клик по пункту меню
    trackButtonClick('menu_item_click', {
      menu_item: itemId,
      destination_path: path,
      friends_count: itemId === 'friends' ? friends.length : undefined
    });
    
    navigate(path);
  };

  return (
    <div className={styles.menu}>
      {menuItems.map((item) => (
        <div
          key={item.id}
          className={styles.menuItem}
          onClick={() => handleNavigation(item.id, item.path)}
        >
          <div className={styles.contentWrapper}>
            <img
              src={item.icon}
              alt={item.title}
              className={styles.iconImage}
            />
            <div>
              <div className={styles.menuTitle}>{item.title}</div>
              <div className={styles.menuDesc}>{item.description}</div>
            </div>
          </div>
          {language === "ar" ? (
            <ChevronLeft size={24} className={styles.menuArrow} />
          ) : (
            <ChevronRight size={24} className={styles.menuArrow} />
          )}
        </div>
      ))}
    </div>
  );
};