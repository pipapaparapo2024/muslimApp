import React from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./Friends.module.css";
import { useFriendsStore } from "./FriendsStore";
import { Check, Wallet } from "lucide-react";
import { t } from "i18next";

const inviteLink = "https://ff6cd8e75312.ngrok-free.app";

export const Friends: React.FC = () => {
  const { friends, loading, error, fetchFriends } = useFriendsStore();

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
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Muslim App!",
          text: "Get rewards and unlock features by joining through my link!",
          url: inviteLink,
        });
      } catch (err) {
        console.log("Share canceled or failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(inviteLink);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy: ", err);
        alert("Failed to copy link. Please manually copy it.");
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
          {/* Кнопка получения награды за запросы */}
          {invitedCount >= requestsGoal && (
            <button
              className={styles.rewardBtn}
              onClick={() => {
                // TODO: Логика получения награды за запросы
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
          {/* Кнопка получения премиум-награды */}
          {purchasedCount >= premiumGoal && (
            <button
              className={styles.rewardBtn}
              onClick={() => {
                // TODO: Логика получения премиум-награды
                alert("Congratulations! You've unlocked Premium!");
              }}
            >
              {t("getReward")}
            </button>
          )}
        </div>

        {/* Список друзей */}
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
