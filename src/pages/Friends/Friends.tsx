import React, { useState, useCallback } from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./Friends.module.css";
import { useFriendsStore } from "../../hooks/useFriendsStore";
import { Check, Wallet, Share, Copy } from "lucide-react";
import { t } from "i18next";
import { openTelegramLink } from "@telegram-apps/sdk";

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

export const Friends: React.FC = () => {
  const { friends, loading, error, fetchFriends } = useFriendsStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const getTelegramId = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    return null;
  };

  const telegram_id = getTelegramId();
  const referalsText = t("joinMeOnMuslimApp");

  const requestsGoal = 10;
  const premiumGoal = 10;

  React.useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Подсчет статистики
  const invitedCount = friends.filter(
    (friend) => friend.status === "invited" || friend.status === "purchased"
  ).length;

  const purchasedCount = friends.filter(
    (friend) => friend.status === "purchased"
  ).length;

  // Сортировка друзей
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.status === "purchased" && b.status !== "purchased") return -1;
    if (a.status !== "purchased" && b.status === "purchased") return 1;
    return 0;
  });

  // Генерация ссылки для приглашения
  const generateInviteLink = useCallback((): string => {
    return `https://t.me/funnyTestsBot?start=ref-${telegram_id}`;
  }, [telegram_id]);

  // Генерация текста для шаринга
  const generateShareText = useCallback((): string => {
    const link = generateInviteLink();
    return `${referalsText}\n\n${link}`;
  }, [referalsText, generateInviteLink]);

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
      alert(t("linkCopiedToClipboard"));
    }
  }, [t]);

  // Открытие нативного шаринга
  const nativeShare = useCallback(async () => {
    const shareData = {
      title: t("inviteFriends"),
      text: generateShareText(),
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
  }, [generateShareText, generateInviteLink, copyToClipboard, t]);

  // Прямое открытие в Telegram (как в первом коде)
  const openInTelegram = useCallback(() => {
    const shareText = generateShareText();
    const telegramUrl = `tg://msg?text=${encodeURIComponent(shareText)}`;
    
    // Пытаемся открыть в приложении Telegram
    window.location.href = telegramUrl;
    
    // Fallback на web версию через 500ms
    setTimeout(() => {
      if (!document.hidden) {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(generateInviteLink())}&text=${encodeURIComponent(referalsText)}`, '_blank');
      }
    }, 500);
  }, [generateShareText, generateInviteLink, referalsText]);

  // Основная функция приглашения (объединенная)
  const handleInvite = useCallback(async () => {
    setIsLoading(true);

    try {
      const webApp = window.Telegram?.WebApp;
      // const shareText = generateShareText();
      const inviteLink = generateInviteLink();

      // Проверяем, находимся ли мы в Telegram WebApp
      if (webApp) {
        // Используем метод из @telegram-apps/sdk для лучшей совместимости
        openTelegramLink(
          `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(referalsText)}`
        );
      } else {
        // Вне Telegram пробуем нативный шаринг
        await nativeShare();
      }

    } catch (error) {
      console.error('Ошибка при открытии диалога:', error);
      
      // Fallback - копируем ссылку
      copyToClipboard(generateShareText());
    } finally {
      setIsLoading(false);
    }
  }, [generateShareText, generateInviteLink, referalsText, nativeShare, copyToClipboard]);

  // Проверка платформы
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (loading) return <div>{t("loading")}</div>;
  if (error) return <div>{error}</div>;

  return (
    <PageWrapper showBackButton>
      <div className={styles.friendsContainer}>
        {/* Карточка приглашения с улучшенным дизайном */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t("earnRewards")}</div>
          <div className={styles.cardDesc}>{t("inviteFriendsDesc")}</div>
          
          <button 
            className={`${styles.inviteBtn} ${isLoading ? styles.loading : ''}`} 
            onClick={handleInvite}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span>⏳</span>
                {t("loading")}
              </>
            ) : (
              <>
                <Share size={18} />
                {t("inviteFriends")}
              </>
            )}
          </button>

          {/* Дополнительные кнопки для мобильных устройств */}
          {isMobile && (
            <button 
              className={styles.telegramBtn}
              onClick={openInTelegram}
            >
              <span>📱</span>
              {t("openInTelegram")}
            </button>
          )}

          {/* Кнопка для копирования ссылки */}
          <button 
            className={styles.copyBtn}
            onClick={() => copyToClipboard(generateInviteLink())}
          >
            <Copy size={16} />
            {t("copyLink")}
          </button>
        </div>

        {/* Остальные карточки без изменений */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t("getFreeRequests")}</div>
          <div className={styles.cardDesc}>{t("freeRequestsDesc")}</div>
          <div className={styles.progressSection}>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${(invitedCount / requestsGoal) * 100}%` }}
              />
            </div>
            <div className={styles.progressLabel}>
              {invitedCount}/{requestsGoal}
            </div>
          </div>
          {invitedCount >= requestsGoal && (
            <button className={styles.rewardBtn}>{t("getReward")}</button>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>{t("unlockPremium")}</div>
          <div className={styles.cardDesc}>{t("unlockPremiumDesc")}</div>
          <div className={styles.progressSection}>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${(purchasedCount / premiumGoal) * 100}%` }}
              />
            </div>
            <div className={styles.progressLabel}>
              {purchasedCount}/{premiumGoal}
            </div>
          </div>
          {purchasedCount >= premiumGoal && (
            <button className={styles.rewardBtn}>{t("getReward")}</button>
          )}
        </div>

        {/* Уведомление о копировании */}
        {copied && (
          <div className={styles.copyNotification}>
            ✅ {t("linkCopiedToClipboard")}
          </div>
        )}

        <div className={styles.emptyInvitations}>
          <div className={styles.emptyTitle}>{t("yourInvitations")}</div>
          {sortedFriends.length === 0 ? (
            <div className={styles.emptyDesc}>{t("noFriendsYet")}</div>
          ) : (
            <div className={styles.friendsList}>
              {sortedFriends.map((friend) => (
                <div key={friend.id} className={styles.friendItem}>
                  <div className={styles.friendName}>{friend.name}</div>
                  <div className={styles.friendStatus}>
                    {friend.status === "invited" && (
                      <div
                        className={`${styles.accepted} ${styles.checkBlock}`}
                      >
                        <Check size={16} />
                        {t("accepted")}
                      </div>
                    )}
                    {friend.status === "purchased" && (
                      <div
                        className={`${styles.purchased} ${styles.checkBlock}`}
                      >
                        <Wallet size={16} />
                        {t("purchased")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};