import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuBlocks.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../../hooks/useLanguages";
import { useFriendsStore } from "../../../hooks/useFriendsStore";
import { trackButtonClick } from "../../../api/analytics";
import { useTranslationsStore } from "../../../hooks/useTranslations";

import Quaran from "../../../assets/icons/quaran1.svg";
import apple from "../../../assets/icons/Applee.svg";
import church from "../../../assets/icons/Churchh.svg";
import muslim from "../../../assets/icons/islam.svg";
import settings from "../../../assets/icons/setting.svg";

export const MenuBlocks: React.FC = () => {
  const navigate = useNavigate();
  const { language, } = useLanguage();
  const { friends, fetchFriends } = useFriendsStore();
  const { translations } = useTranslationsStore();
  useEffect(() => {
    fetchFriends();
  }, []);

  const menuItems = [
    {
      id: "quran",
      eventName: "click_read_quran",
      icon: Quaran,
      title: translations?.readQuran,
      description: translations?.openAndRead,
      path: "/quran",
    },
    {
      id: "qna",
      eventName: "click_qa",
      icon: church,
      title: translations?.askAboutFaith,
      description: translations?.getAnswers,
      path: "/qna",
    },
    {
      id: "scanner",
      eventName: "click_food_scan",
      icon: apple,
      title: translations?.foodScanner,
      description: translations?.checkProduct,
      path: "/scanner",
    },
    {
      id: "friends",
      eventName: "click_friends",
      icon: muslim,
      title: translations?.friends,
      description: translations?.shareApp,
      path: friends.length > 0 ? "/friends" : "/welcomeFriends",
    },
    {
      id: "settings",
      eventName: "click_settings",
      icon: settings,
      title: translations?.settings,
      description: translations?.selectSettings,
      path: "/settings",
    },
  ];

  const handleNavigation = (eventName: string, path: string) => {
    trackButtonClick("main", eventName);
    navigate(path);
  };

  return (
    <div className={styles.menu}>
      {menuItems.map((item) => (
        <div
          key={item.id}
          className={styles.menuItem}
          onClick={() => handleNavigation(item.eventName, item.path)}
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
            <ChevronLeft size={24} />
          ) : (
            <ChevronRight size={24} />
          )}
        </div>
      ))}
    </div>
  );
};
