import React from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./Friends.module.css";
import { useFriendsStore } from "../../hooks/useFriendsStore";
import { Check, Wallet } from "lucide-react";
import { t } from "i18next";
import { openTelegramLink } from "@telegram-apps/sdk";

export const Friends: React.FC = () => {
  const { friends, loading, error, fetchFriends } = useFriendsStore();

  const getTelegramId = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    return null;
  };

  const telegram_id = getTelegramId();
  const referalsText = "http://yandex.ru";

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

  const handleInvite = async () => {
    const shareUrl = `https://t.me/funnyTestsBot?start=ref-${telegram_id}`;

    // Определяем тип устройства
    // const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    // Для Android используем Telegram-специфичное открытие
    if (isAndroid && window.Telegram?.WebApp) {
      openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(referalsText)}`
      );
      return;
    }

    // Для iOS и других устройств используем Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("joinMeOnMuslimApp"),
          text: t("getRewardsAndUnlockFeatures"),
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share canceled or failed:", err);
      }
    } else {
      // Fallback для браузеров без поддержки Web Share API
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          alert(t("linkCopiedToClipboard"));
        })
        .catch(() => {
          // Резервный вариант для старых браузеров
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.body.removeChild(textArea);
          alert(t("linkCopiedToClipboard"));
        });
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
