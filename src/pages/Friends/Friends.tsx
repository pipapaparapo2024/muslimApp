// import React from "react";
// import { PageWrapper } from "../../shared/PageWrapper";
// import styles from "./Friends.module.css";
// import { useFriendsStore } from "../../hooks/useFriendsStore";
// import { Check, Wallet } from "lucide-react";
// import { t } from "i18next";
// import { openTelegramLink } from "@telegram-apps/sdk";

// export const Friends: React.FC = () => {
//   const { friends, loading, error, fetchFriends } = useFriendsStore();

//   const getTelegramId = () => {
//     if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
//       return window.Telegram.WebApp.initDataUnsafe.user.id;
//     }
//     return null;
//   };

//   const telegram_id = getTelegramId();
//   const referalsText = "Присоединяйся к Muslim App!";

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

//   const handleInvite = async () => {
//     const shareUrl = `https://t.me/funnyTestsBot?start=ref-${telegram_id}`;

//     // Для Telegram используем специальный метод
//     if (window.Telegram?.WebApp) {
//       // ПРАВИЛЬНЫЙ ФОРМАТ URL для Android
//       openTelegramLink(
//         `https://t.me/share/url?url=${shareUrl}&text=${encodeURIComponent(referalsText)}`
//       );
//       return;
//     }

//     // Для iOS и других устройств используем Web Share API
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: t("joinMeOnMuslimApp"),
//           text: `${t("getRewardsAndUnlockFeatures")}\n\n${referalsText}`,
//           url: shareUrl,
//         });
//       } catch (err) {
//         console.log("Share canceled or failed:", err);
//         // Fallback на копирование ссылки
//         copyToClipboard(shareUrl);
//       }
//     } else {
//       copyToClipboard(shareUrl);
//     }
//   };

//   // Функция для копирования в буфер обмена
//   const copyToClipboard = (text: string) => {
//     navigator.clipboard.writeText(text)
//       .then(() => {
//         alert(t("linkCopiedToClipboard"));
//       })
//       .catch(() => {
//         // Резервный вариант
//         const textArea = document.createElement("textarea");
//         textArea.value = text;
//         document.body.appendChild(textArea);
//         textArea.select();
//         document.execCommand('copy');
//         document.body.removeChild(textArea);
//         alert(t("linkCopiedToClipboard"));
//       });
//   };

//   if (loading) return <div>{t("loading")}</div>;
//   if (error) return <div>{error}</div>;

//   return (
//     <PageWrapper showBackButton>
//       <div className={styles.friendsContainer}>
//         <div className={styles.card}>
//           <div className={styles.cardTitle}>{t("earnRewards")}</div>
//           <div className={styles.cardDesc}>{t("inviteFriendsDesc")}</div>
//           <button className={styles.inviteBtn} onClick={handleInvite}>
//             {t("inviteFriends")}
//           </button>
//         </div>

//         {/* Остальной код без изменений */}
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

import React, { useState, useCallback } from 'react';

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
  botUsername = 'your_bot_username',
  referralCode = 'REF123',
  inviteText = 'Присоединяйся к нашему чату!'
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

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

  // Копирование ссылки в буфер обмена
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
  }, []);

  // Открытие нативного шаринга
  const nativeShare = useCallback(async () => {
    const shareData = {
      title: 'Приглашение в Telegram',
      text: inviteText,
      url: generateInviteLink()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      // Fallback к копированию ссылки
      copyToClipboard(generateShareText());
    }
  }, [inviteText, generateInviteLink, generateShareText, copyToClipboard]);

  // Открытие диалога приглашения
  const openInviteDialog = useCallback(async () => {
    setIsLoading(true);

    try {
      const webApp = window.Telegram?.WebApp;
      const shareText = generateShareText();
      const inviteLink = generateInviteLink();

      // Проверяем, находимся ли мы в Telegram WebApp
      if (webApp) {
        webApp.showPopup({
          title: 'Пригласить друзей',
          message: `Скопируйте ссылку и отправьте друзьям:\n\n${inviteLink}`,
          buttons: [
            { type: 'default', text: 'Копировать ссылку' },
            { type: 'cancel' }
          ]
        });

        // В Telegram WebApp можно также использовать открытие ссылок
        // webApp.openTelegramLink(`tg://msg?text=${encodeURIComponent(shareText)}`);
        
      } else {
        // Вне Telegram пробуем нативный шаринг
        await nativeShare();
      }

    } catch (error) {
      console.error('Ошибка при открытии диалога:', error);
      
      // Fallback - показываем модальное окно с ссылкой
      const shareText = generateShareText();
      copyToClipboard(shareText);
      
      alert('Ссылка для приглашения скопирована в буфер обмена!');
    } finally {
      setIsLoading(false);
    }
  }, [generateShareText, generateInviteLink, nativeShare, copyToClipboard]);

  // Прямое открытие в Telegram
  const openInTelegram = useCallback(() => {
    const shareText = generateShareText();
    const telegramUrl = `tg://msg?text=${encodeURIComponent(shareText)}`;
    
    // Пытаемся открыть в приложении Telegram
    window.location.href = telegramUrl;
    
    // Fallback на web версию через 500ms
    setTimeout(() => {
      if (!document.hidden) {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(generateInviteLink())}&text=${encodeURIComponent(inviteText)}`, '_blank');
      }
    }, 500);
  }, [generateShareText, generateInviteLink, inviteText]);

  // Проверка платформы
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <button
        onClick={openInviteDialog}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#6c757d' : '#0088cc',
          color: 'white',
          padding: '16px 32px',
          border: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          margin: '10px',
          minWidth: '250px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
        onMouseOver={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#0066a4';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 136, 204, 0.4)';
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#0088cc';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 136, 204, 0.3)';
          }
        }}
      >
        {isLoading ? (
          <>
            <span>⏳</span>
            Загрузка...
          </>
        ) : (
          <>
            <span>👥</span>
            Пригласить друзей
          </>
        )}
      </button>

      {copied && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          animation: 'fadeInOut 2s ease-in-out'
        }}>
          ✅ Ссылка скопирована!
        </div>
      )}

      {/* Дополнительные опции для мобильных устройств */}
      {isMobile && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={openInTelegram}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              margin: '5px',
              transition: 'background-color 0.2s ease'
            }}
          >
            📱 Открыть в Telegram
          </button>
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
        `}
      </style>
    </div>
  );
};
