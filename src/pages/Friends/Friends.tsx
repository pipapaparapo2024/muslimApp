import React from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./Friends.module.css";
import { useFriendsStore } from "../../hooks/useFriendsStore";
import { Check, Wallet } from "lucide-react";
import { t } from "i18next";

const inviteLink =
  "https://ya.ru/?npr=1&nr=1&redirect_ts=1756905495.00000&utm_referrer=https%3A%2F%2Fwww.google.com%2F";

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
    // Проверяем, доступен ли Web Share API и работает ли он корректно
    const isShareAPIAvailable = () => {
      return navigator.share && typeof navigator.share === "function";
    };

    // Дополнительная проверка для Android WebView
    const isAndroidWebView = () => {
      return (
        /Android/i.test(navigator.userAgent) &&
        /WebView/i.test(navigator.userAgent)
      );
    };

    if (isShareAPIAvailable() && !isAndroidWebView()) {
      try {
        await navigator.share({
          title: "Join me on Muslim App!",
          text: "Get rewards and unlock features by joining through my link!",
          url: inviteLink,
        });
      } catch (err) {
        console.log("Share canceled or failed:", err);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      // Показываем уведомление о копировании
      alert(t("linkCopied")); // Добавьте перевод для "Link copied to clipboard!"
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback для старых браузеров
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      textArea.style.position = "fixed";
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
