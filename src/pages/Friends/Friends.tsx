import React, { useState, useEffect } from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./Friends.module.css";
import { useFriendsStore } from "../../hooks/useFriendsStore";
import { Check, Wallet, Share } from "lucide-react";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { trackButtonClick } from "../../api/analytics";
import { useTranslationsStore } from "../../hooks/useTranslations";
export const Friends: React.FC = () => {
  const {
    friends,
    referralLink,
    loading,
    error,
    fetchFriends,
    fetchReferralLink,
    fetchBonusesStatus,
    purchasedHas,
    purchasedNeeded,
    totalHas,
    totalNeeded,
    claimTotalReward,
    claimPurchasedReward,
  } = useFriendsStore();
  const [isLoading] = useState<boolean>(false);
  const { translations } = useTranslationsStore();
  useEffect(() => {
    fetchReferralLink();
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchReferralLink();
    fetchBonusesStatus();
  }, [fetchFriends, fetchReferralLink, fetchBonusesStatus]);

  const shareViaTelegram = () => {
    if (!referralLink) return;
    trackButtonClick("friends", "click_invite_friends");

    const shareText = "Присоединяйся к нашему крутому приложению! 🚀";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink
    )}&text=${encodeURIComponent(shareText)}`;

    window.open(shareUrl, "_blank");
  };

  const handleGetFreeRequestsReward = async () => {
    try {

      await claimTotalReward();
      alert(translations?.rewardClaimed);

      await fetchBonusesStatus();
    } catch (error) {
      console.error("Ошибка при получении награды:", error);
      alert(translations?.rewardClaimError);
    }
  };

  const handleGetPremiumReward = async () => {
    try {
      await claimPurchasedReward();
      alert(translations?.premiumUnlocked);

      await fetchBonusesStatus();
    } catch (error) {
      console.error("Ошибка при получении премиум награды:", error);
      alert(translations?.premiumUnlockError);
    }
  };
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.status === "Purchased" && b.status !== "Purchased") return -1;
    if (a.status !== "Purchased" && b.status === "Purchased") return 1;
    return 0;
  });

  if (loading)
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  if (error) return <div>{error}</div>;

  return (
    <PageWrapper showBackButton>
      <div className={styles.friendsContainer}>
        {/* Карточка с реферальной ссылкой */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>{translations?.earnRewards} </div>
          <div className={styles.cardDesc}>
            {translations?.inviteFriendsDesc}
          </div>

          <button
            className={`${styles.inviteBtn} ${isLoading ? styles.loading : ""}`}
            onClick={shareViaTelegram}
            disabled={isLoading || !referralLink}
          >
            {isLoading ? (
              <>{translations?.loading}</>
            ) : (
              <>
                <Share size={18} />
                {translations?.inviteFriends}
              </>
            )}
          </button>
        </div>

        {/* Карточка бесплатных запросов */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            {translations?.getFreeRequests}
          </div>
          <div className={styles.cardDesc}>
            {translations?.freeRequestsDesc}
          </div>
          <div className={styles.progressSection}>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${(totalHas / totalNeeded) * 100}%` }}
              />
            </div>
            <div className={styles.progressLabel}>
              {totalHas}/{totalNeeded}
            </div>
          </div>
          {totalHas >= totalNeeded && (
            <button
              className={styles.rewardBtn}
              onClick={handleGetFreeRequestsReward}
            >
              {translations?.getReward}
            </button>
          )}
        </div>

        {/* Карточка премиум доступа */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>{translations?.unlockPremium}</div>
          <div className={styles.cardDesc}>
            {translations?.unlockPremiumDesc}
          </div>
          <div className={styles.progressSection}>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${(purchasedHas / purchasedNeeded) * 100}%` }}
              />
            </div>
            <div className={styles.progressLabel}>
              {purchasedHas}/{purchasedNeeded}
            </div>
          </div>
          {purchasedHas >= purchasedNeeded && (
            <button
              className={styles.rewardBtn}
              onClick={handleGetPremiumReward}
            >
              {translations?.getReward}
            </button>
          )}
        </div>

        {/* Список приглашенных друзей */}
        <div className={styles.emptyInvitations}>
          <div className={styles.emptyTitle}>
            {translations?.yourInvitations}
          </div>
          {sortedFriends.length === 0 ? (
            <div className={styles.emptyDesc}>{translations?.noFriendsYet}</div>
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
                        {translations?.accepted}
                      </div>
                    )}
                    {friend.status === "Purchased" && (
                      <div
                        className={`${styles.purchased} ${styles.checkBlock}`}
                      >
                        <Wallet size={16} />
                        {translations?.purchased}
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
