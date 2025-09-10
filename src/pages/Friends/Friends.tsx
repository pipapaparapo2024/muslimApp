// import React, { useState, useCallback } from "react";
// import { PageWrapper } from "../../shared/PageWrapper";
// import styles from "./Friends.module.css";
// import { useFriendsStore } from "../../hooks/useFriendsStore";
// import { Check, Wallet, Share } from "lucide-react";
// import { t } from "i18next";

// interface TelegramWebApp {
//   WebApp?: {
//     showPopup: (params: {
//       title: string;
//       message: string;
//       buttons: Array<{ type: string; text?: string }>;
//     }) => void;
//     showAlert: (message: string) => void;
//     showConfirm: (
//       title: string,
//       message: string,
//       callback: (result: boolean) => void
//     ) => void;
//     openTelegramLink: (url: string) => void;
//     platform: string;
//     version: string;
//     initDataUnsafe?: {
//       user?: {
//         id: number;
//         first_name: string;
//         last_name?: string;
//         username?: string;
//       };
//     };
//   };
// }

// declare global {
//   interface Window {
//     Telegram?: TelegramWebApp;
//   }
// }

// export const Friends: React.FC = () => {
//   const { friends, loading, error, fetchFriends } = useFriendsStore();
//   const [isLoading, ] = useState<boolean>(false);
//   const [copied, ] = useState<boolean>(false);

//   const getTelegramId = () => {
//     if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
//       return window.Telegram.WebApp.initDataUnsafe.user.id;
//     }
//     return null;
//   };

//   const telegram_id = getTelegramId();
//   const referalsText = t("joinMeOnMuslimApp");

//   const requestsGoal = 10;
//   const premiumGoal = 10;

//   React.useEffect(() => {
//     fetchFriends();
//   }, [fetchFriends]);

//   // Подсчет статистики
//   const invitedCount = friends.filter(
//     (friend) => friend.status === "invited" || friend.status === "purchased"
//   ).length;

//   const purchasedCount = friends.filter(
//     (friend) => friend.status === "purchased"
//   ).length;

//   // Сортировка друзей
//   const sortedFriends = [...friends].sort((a, b) => {
//     if (a.status === "purchased" && b.status !== "purchased") return -1;
//     if (a.status !== "purchased" && b.status === "purchased") return 1;
//     return 0;
//   });

//   // Генерация ссылки для приглашения
//   const generateInviteLink = useCallback((): string => {
//     return `https://t.me/funnyTestsBot?start=ref-${telegram_id}`;
//   }, [telegram_id]);

//   // Генерация текста для шаринга
//   const generateShareText = useCallback((): string => {
//     const link = generateInviteLink();
//     return `${referalsText}\n\n${link}`;
//   }, [referalsText, generateInviteLink]);

//   // Прямое открытие в Telegram (как в первом коде)
//   const openInTelegram = useCallback(() => {
//     const shareText = generateShareText();
//     const telegramUrl = `tg://msg?text=${encodeURIComponent(shareText)}`;

//     // Пытаемся открыть в приложении Telegram
//     window.location.href = telegramUrl;

//     // Fallback на web версию через 500ms
//     setTimeout(() => {
//       if (!document.hidden) {
//         window.open(
//           `https://t.me/share/url?url=${encodeURIComponent(
//             generateInviteLink()
//           )}&text=${encodeURIComponent(referalsText)}`,
//           "_blank"
//         );
//       }
//     }, 500);
//   }, [generateShareText, generateInviteLink, referalsText]);

//   if (loading) return <div>{t("loading")}</div>;
//   if (error) return <div>{error}</div>;

//   return (
//     <PageWrapper showBackButton>
//       <div className={styles.friendsContainer}>
//         {/* Карточка приглашения с улучшенным дизайном */}
//         <div className={styles.card}>
//           <div className={styles.cardTitle}>{t("earnRewards")}</div>
//           <div className={styles.cardDesc}>{t("inviteFriendsDesc")}</div>

//           <button
//             className={`${styles.inviteBtn} ${isLoading ? styles.loading : ""}`}
//             onClick={openInTelegram}
//             disabled={isLoading}
//           >
//             {isLoading ? (
//               <>
//                 <span>⏳</span>
//                 {t("loading")}
//               </>
//             ) : (
//               <>
//                 <Share size={18} />
//                 {t("inviteFriends")}
//               </>
//             )}
//           </button>
//         </div>

//         {/* Остальные карточки без изменений */}
//         <div className={styles.card}>
//           <div className={styles.cardTitle}>{t("getFreeRequests")}</div>
//           <div className={styles.cardDesc}>{t("freeRequestsDesc")}</div>
//           <div className={styles.progressSection}>
//             <div className={styles.progressBarContainer}>
//               <div
//                 className={styles.progressBar}
//                 style={{ width: `${(invitedCount / requestsGoal) * 100}%` }}
//               />
//             </div>
//             <div className={styles.progressLabel}>
//               {invitedCount}/{requestsGoal}
//             </div>
//           </div>
//           {invitedCount >= requestsGoal && (
//             <button className={styles.rewardBtn}>{t("getReward")}</button>
//           )}
//         </div>

//         <div className={styles.card}>
//           <div className={styles.cardTitle}>{t("unlockPremium")}</div>
//           <div className={styles.cardDesc}>{t("unlockPremiumDesc")}</div>
//           <div className={styles.progressSection}>
//             <div className={styles.progressBarContainer}>
//               <div
//                 className={styles.progressBar}
//                 style={{ width: `${(purchasedCount / premiumGoal) * 100}%` }}
//               />
//             </div>
//             <div className={styles.progressLabel}>
//               {purchasedCount}/{premiumGoal}
//             </div>
//           </div>
//           {purchasedCount >= premiumGoal && (
//             <button className={styles.rewardBtn}>{t("getReward")}</button>
//           )}
//         </div>

//         {/* Уведомление о копировании */}
//         {copied && (
//           <div className={styles.copyNotification}>
//             ✅ {t("linkCopiedToClipboard")}
//           </div>
//         )}

//         <div className={styles.emptyInvitations}>
//           <div className={styles.emptyTitle}>{t("yourInvitations")}</div>
//           {sortedFriends.length === 0 ? (
//             <div className={styles.emptyDesc}>{t("noFriendsYet")}</div>
//           ) : (
//             <div className={styles.friendsList}>
//               {sortedFriends.map((friend) => (
//                 <div key={friend.id} className={styles.friendItem}>
//                   <div className={styles.friendName}>{friend.name}</div>
//                   <div className={styles.friendStatus}>
//                     {friend.status === "invited" && (
//                       <div
//                         className={`${styles.accepted} ${styles.checkBlock}`}
//                       >
//                         <Check size={16} />
//                         {t("accepted")}
//                       </div>
//                     )}
//                     {friend.status === "purchased" && (
//                       <div
//                         className={`${styles.purchased} ${styles.checkBlock}`}
//                       >
//                         <Wallet size={16} />
//                         {t("purchased")}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </PageWrapper>
//   );
// };
import React, { useState, useCallback } from "react";

interface TelegramWebApp {
  WebApp?: {
    showPopup: (params: {
      title: string;
      message: string;
      buttons: Array<{ type: string; text?: string }>;
    }) => void;
    showAlert: (message: string) => void;
    showConfirm: (
      title: string,
      message: string,
      callback: (result: boolean) => void
    ) => void;
    openTelegramLink: (url: string) => void;
    platform: string;
    version: string;
    initDataUnsafe?: {
      user?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
      };
    };
  };
}

declare global {
  interface Window {
    Telegram?: TelegramWebApp;
  }
}

interface InviteFriendProps {
  botUsername?: string;
  referralCode?: string;
  inviteText?: string;
}

export const Friends: React.FC<InviteFriendProps> = ({
  botUsername = "your_bot_username",
  referralCode = "REF123",
  inviteText = "Присоединяйся к нашему чату!",
}) => {
  const [copied, ] = useState<boolean>(false);

  // Генерация ссылки для приглашения
  const generateInviteLink = useCallback((): string => {
    const baseUrl = `https://t.me/${botUsername}?start=${referralCode}`;
    return baseUrl;
  }, [botUsername, referralCode]);

  // Генерация текста для шаринга
  const generateShareText = useCallback((): string => {
    const link = generateInviteLink();
    return `${inviteText}\n\n${link}`;
  }, [inviteText, generateInviteLink]);
  
  // ПРАВИЛЬНОЕ открытие в Telegram для Android
  const openInTelegram = useCallback(() => {
    const shareText = generateShareText();
    const inviteLink = generateInviteLink();
    
    // Создаем iframe для безопасного открытия deeplink'а
    const openTelegramDeeplink = () => {
      try {
        // Пытаемся открыть через deeplink
        const telegramUrl = `tg://msg?text=${encodeURIComponent(shareText)}`;
        
        // Создаем невидимый iframe для обхода блокировок
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = telegramUrl;
        document.body.appendChild(iframe);
        
        // Удаляем iframe через короткое время
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
        
      } catch (error) {
        console.error('Error opening Telegram deeplink:', error);
      }
    };

    // Запускаем открытие deeplink'а
    openTelegramDeeplink();

    // Fallback: если через 300ms приложение не открылось, показываем web версию
    setTimeout(() => {
      // Проверяем, остались ли мы на той же странице
      if (!document.hidden && window.location.href !== 'about:blank') {
        // Открываем web версию Telegram
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteText)}`,
          "_blank"
        );
      }
    }, 300);
  }, [generateShareText, generateInviteLink, inviteText]);

  // Альтернативный метод для Android через user gesture
  const openInTelegramAndroid = useCallback(() => {
    const shareText = generateShareText();
    const inviteLink = generateInviteLink();
    
    // Этот метод работает лучше на Android благодаря прямому user gesture
    const telegramUrl = `tg://msg?text=${encodeURIComponent(shareText)}`;
    
    // Пытаемся открыть через window.location (работает в некоторых браузерах)
    window.location.href = telegramUrl;
    
    // Дублируем через window.open для надежности
    const newWindow = window.open(telegramUrl, '_blank');
    
    // Если оба метода не сработали, fallback на web версию
    setTimeout(() => {
      if (!document.hidden && (!newWindow || newWindow.closed)) {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteText)}`,
          "_blank"
        );
      }
    }, 500);
  }, [generateShareText, generateInviteLink, inviteText]);

  // Универсальный метод открытия Telegram
  const handleOpenTelegram = useCallback(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Для Android используем специальный метод
      openInTelegramAndroid();
    } else {
      // Для iOS и других используем стандартный метод
      openInTelegram();
    }
  }, [openInTelegram, openInTelegramAndroid]);

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <button
        onClick={handleOpenTelegram}
        style={{
          backgroundColor: "#28a745",
          color: "white",
          padding: "12px 24px",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          cursor: "pointer",
          margin: "5px",
          transition: "background-color 0.2s ease",
          minWidth: "200px"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#218838";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#28a745";
        }}
        onTouchStart={(e) => {
          // Добавляем touch feedback для мобильных устройств
          e.currentTarget.style.transform = "scale(0.98)";
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        📱 Открыть в Telegram
      </button>

      {copied && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#28a745",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            animation: "fadeInOut 2s ease-in-out",
          }}
        >
          ✅ Ссылка скопирована!
        </div>
      )}

      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
          }
          
          /* Улучшаем feedback для мобильных устройств */
          button:active {
            transform: scale(0.98);
          }
        `}
      </style>
    </div>
  );
};