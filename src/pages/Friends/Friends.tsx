import React from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./Friends.module.css";
import { useFriendsStore } from "../../hooks/useFriendsStore";
import { Check, Wallet } from "lucide-react";
import { t } from "i18next";
import { openTelegramLink } from "@telegram-apps/sdk";

export const Friends: React.FC = () => {
  const { friends, loading, error, fetchFriends } = useFriendsStore();
  
  // Получаем Telegram ID напрямую из WebApp
  const getTelegramId = () => {
    // Способ 1: Из initData (наиболее надежный)
    if (window.Telegram?.WebApp?.initData) {
      const initData = new URLSearchParams(window.Telegram.WebApp.initData);
      const userStr = initData.get('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.id;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    
    // Способ 2: Из WebApp (если доступно)
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    
    // Способ 3: Из query параметров (резервный)
    const urlParams = new URLSearchParams(window.location.search);
    const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
    if (tgWebAppStartParam && tgWebAppStartParam.startsWith('ref-')) {
      const refId = tgWebAppStartParam.replace('ref-', '');
      if (refId && !isNaN(Number(refId))) {
        return Number(refId);
      }
    }
    
    console.warn('Telegram ID not found');
    return null;
  };

  const telegram_id = getTelegramId();
  const referalsText = "http://yandex.ru";

  const requestsGoal = 10;
  const premiumGoal = 10;

  React.useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Подсчитываем количество приглашенных и купивших друзей
  const invitedCount = friends.filter(
    (friend) => friend.status === "invited" || friend.status === "purchased"
  ).length;
  const purchasedCount = friends.filter(
    (friend) => friend.status === "purchased"
  ).length;

  // Сортируем друзей: сначала purchased, потом invited
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.status === "purchased" && b.status !== "purchased") return -1;
    if (a.status !== "purchased" && b.status === "purchased") return 1;
    return 0;
  });

  const handleInvite = async () => {
    if (!telegram_id) {
      alert(t("telegramIdNotFound"));
      return;
    }

    // Проверяем, является ли устройство Android
    const isAndroid = () => {
      return /Android/i.test(navigator.userAgent);
    };

    // Для Android устройств используем Telegram-специфичное открытие
    if (isAndroid() && window.Telegram?.WebApp) {
      if (!referalsText) return;
      
      openTelegramLink(
        `https://t.me/share/url?url=https://t.me/funnyTestsBot?start=ref-${telegram_id}&text=${encodeURIComponent(referalsText)}`
      );
    } else {
      // Для остальных устройств используем стандартный шаринг
      const isShareAPIAvailable = () => {
        return navigator.share && typeof navigator.share === "function";
      };

      const isMobileDevice = () => {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
      };

      if (isShareAPIAvailable() && isMobileDevice()) {
        try {
          await navigator.share({
            title: t("joinMeOnMuslimApp"),
            text: t("getRewardsAndUnlockFeatures"),
            url: `https://t.me/funnyTestsBot?start=ref-${telegram_id}`,
          });
          console.log("Share successful");
        } catch (err) {
          console.log("Share canceled or failed:", err);
          copyToClipboard();
        }
      } else {
        copyToClipboard();
      }
    }
  };

  const copyToClipboard = async () => {
    if (!telegram_id) {
      alert(t("telegramIdNotFound"));
      return;
    }

    const inviteLink = `https://t.me/funnyTestsBot?start=ref-${telegram_id}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert(t("linkCopied"));
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback для старых браузеров
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand("copy");
        if (successful) {
          alert(t("linkCopied"));
        } else {
          alert(t("copyFailed"));
        }
      } catch (_) {
        alert(t("copyFailed"));
      }

      document.body.removeChild(textArea);
    }
  };

  if (loading) return <div>{t("loading")}</div>;
  if (error) return <div>{error}</div>;

  return (
    <PageWrapper showBackButton>
      <div className={styles.friendsContainer}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t("earnRewards")}</div>
          <div className={styles.cardDesc}>{t("inviteFriendsDesc")}</div>
          <button className={styles.inviteBtn} onClick={handleInvite}>
            {t("inviteFriends")}
          </button>
        </div>

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
            <button
              className={styles.rewardBtn}
              onClick={() => {
                alert("Congratulations! You've earned free requests!");
              }}
            >
              {t("getReward")}
            </button>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>{t("unlockPremium")}</div>
          <div className={styles.cardDesc}>{t("unlockPremiumDesc")}</div>
          <div className={styles.progressSection}>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{
                  width: `${(purchasedCount / premiumGoal) * 100}%`,
                }}
              />
            </div>
            <div className={styles.progressLabel}>
              {purchasedCount}/{premiumGoal}
            </div>
          </div>
          {purchasedCount >= premiumGoal && (
            <button
              className={styles.rewardBtn}
              onClick={() => {
                alert("Congratulations! You've unlocked Premium!");
              }}
            >
              {t("getReward")}
            </button>
          )}
        </div>

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