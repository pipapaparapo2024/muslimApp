import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MenuBlocks.module.css';
import { useMenuBlocksStore } from './MenuBlocksStore';

export const MenuBlocks: React.FC = () => {
  const navigate = useNavigate();
  const { menuItems, isFriendsWelcomeShown } = useMenuBlocksStore();

  const handleNavigation = (path: string, itemId: string) => {
    if (itemId === 'friends') {
      // Для пункта "Friends" используем условную навигацию
      const targetPath = isFriendsWelcomeShown ? '/friends' : '/friends-welcome';
      navigate(targetPath);
    } else {
      navigate(path);
    }
  };

  return (
    <div className={styles.menu}>
      {menuItems.map((item) => (
        <div 
          key={item.id}
          className={styles.menuItem} 
          onClick={() => handleNavigation(item.path, item.id)}
        >
          <span className={styles.menuIcon} role="img" aria-label={item.id}>
            {item.icon}
          </span>
          <div className={styles.menuText}>
            <div className={styles.menuTitle}>{item.title}</div>
            <div className={styles.menuDesc}>{item.description}</div>
          </div>
          <span className={styles.menuArrow}>›</span>
        </div>
      ))}
    </div>
  );
};