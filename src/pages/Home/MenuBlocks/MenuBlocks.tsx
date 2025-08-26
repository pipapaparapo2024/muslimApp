import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuBlocks.module.css";
import { menuItems } from "../../Home/MenuBlocks/MenuBlocksStore";
import { ChevronRight } from "lucide-react";
export const MenuBlocks: React.FC = () => {
  const navigate = useNavigate();
  const handleNavigation = (path: string) => {
      navigate(path);
    }

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
          <span className={styles.menuArrow}><ChevronRight size={24}/></span>
        </div>
      ))}
    </div>
  );
};
