import React, { useState, useEffect } from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./Friends.module.css";
import { useFriendsStore } from "../../hooks/useFriendsStore";
import { Check, Wallet, Share } from "lucide-react";
import { t } from "i18next";

export const Friends: React.FC = () => {
  const {
    friends,
    referralLink,
    loading,
    error,
    fetchFriends,
    fetchReferralLink,
  } = useFriendsStore();
  const [isLoading] = useState<boolean>(false);

  const requestsGoal = 10;
  const premiumGoal = 10;

  useEffect(() => {
    fetchReferralLink();
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchReferralLink();
  }, [fetchFriends, fetchReferralLink]);

  const shareViaTelegram = () => {
    if (!referralLink) return;

    const shareText = "Присоединяйся к нашему крутому приложению! 🚀";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink
    )}&text=${encodeURIComponent(shareText)}`;

    window.open(shareUrl, "_blank");
  };

  // Подсчет статистики
  const invitedCount = friends.filter(
    (friend) => friend.status === "Accepted" || friend.status === "Purchased"
  ).length;

  const purchasedCount = friends.filter(
    (friend) => friend.status === "Purchased"
  ).length;

  // Сортировка друзей
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.status === "Purchased" && b.status !== "Purchased") return -1;
    if (a.status !== "Purchased" && b.status === "Purchased") return 1;
    return 0;
  });

  if (loading) return <div>{t("loading")}</div>;
  if (error) return <div>{error}</div>;

  return (
    <PageWrapper showBackButton>
      <div className={styles.friendsContainer}>
        {/* Карточка с реферальной ссылкой */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t("earnRewards")}</div>
          <div className={styles.cardDesc}>{t("inviteFriendsDesc")}</div>

          <button
            className={`${styles.inviteBtn} ${isLoading ? styles.loading : ""}`}
            onClick={shareViaTelegram}
            disabled={isLoading || !referralLink}
          >
            {isLoading ? (
              <>{t("loading")}</>
            ) : (
              <>
                <Share size={18} />
                {t("inviteFriends")}
              </>
            )}
          </button>
        </div>

        {/* Карточка бесплатных запросов */}
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

        {/* Карточка премиум доступа */}
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

        {/* Список приглашенных друзей */}
        <div className={styles.emptyInvitations}>
          <div className={styles.emptyTitle}>{t("yourInvitations")}</div>
          {sortedFriends.length === 0 ? (
            <div className={styles.emptyDesc}>{t("noFriendsYet")}</div>
          ) : (
            <div className={styles.friendsList}>
              {sortedFriends.map((friend, id) => (
                <div key={id} className={styles.friendItem}>
                  <div className={styles.friendInfo}>
                    <div className={styles.friendName}>{friend.userName}</div>
                  </div>
                  <div className={styles.friendStatus}>
                    {friend.status === "Accepted" && (
                      <div
                        className={`${styles.accepted} ${styles.checkBlock}`}
                      >
                        <Check size={16} />
                        {t("accepted")}
                      </div>
                    )}
                    {friend.status === "Purchased" && (
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
