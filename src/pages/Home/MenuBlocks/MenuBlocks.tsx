import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuBlocks.module.css";
import { menuItems } from "../../Home/MenuBlocks/MenuBlocksStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../../hooks/useLanguages";
export const MenuBlocks: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
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
