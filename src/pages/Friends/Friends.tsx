import React, { useState } from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./Friends.module.css";
import { useFriendsStore } from "../../hooks/useFriendsStore";
import { Check, Wallet } from "lucide-react";
import { t } from "i18next";

// Пример ссылки (замените на реальную)
const inviteLink = "https://t.me/your_bot?start=ref_12345";

export const Friends: React.FC = () => {
  const { friends, loading, error, fetchFriends } = useFriendsStore();

  const [copied, setCopied] = useState(false);

  const requestsGoal = 10;
  const premiumGoal = 10;

  React.useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Подсчитываем количество приглашённых и купивших друзей
  const invitedCount = friends.filter(
    (friend) => friend.status === "invited" || friend.status === "purchased"
  ).length;
  const purchasedCount = friends.filter(
    (friend) => friend.status === "purchased"
  ).length;

  // Сортируем: сначала купившие, потом просто приглашённые
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.status === "purchased" && b.status !== "purchased") return -1;
    if (a.status !== "purchased" && b.status === "purchased") return 1;
    return 0;
  });

const handleInvite = async () => {
  // Проверяем, открыто ли приложение в Telegram WebApp
  const isInTelegram = !!window.Telegram?.WebApp;

  if (isInTelegram) {
    try {
      // Используем нативный метод Telegram для шаринга
      window.Telegram?.WebApp.share(
        inviteLink,
        t("inviteFriendText", "Присоединяйся по моей ссылке и получи награды!")
      );
    } catch (err) {
      console.log("Telegram share failed or was cancelled", err);
      // Если что-то пошло не так — копируем
      copyLink();
    }
    return;
  }

  // Если НЕ в Telegram — пробуем Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: t("inviteFriendTitle", "Присоединяйся ко мне в Muslim App!"),
        text: t(
          "inviteFriendText",
          "Присоединяйся по моей ссылке и получи награды!"
        ),
        url: inviteLink,
      });
    } catch (err) {
      console.log("Share cancelled or failed", err);
      copyLink();
    }
  } else {
    // Fallback: копируем ссылку
    copyLink();
  }
};

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      // Fallback для старых браузеров
      fallbackCopy(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy failed", err);
    }

    document.body.removeChild(textarea);
  };

  if (loading) {
    return (
      <PageWrapper showBackButton>
        <div className={styles.loading}>{t("loading")}...</div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper showBackButton>
        <div className={styles.error}>{error}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton>
      <div className={styles.friendsContainer}>
        {/* Карточка: Заработай награды */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t("earnRewards")}</div>
          <div className={styles.cardDesc}>{t("inviteFriendsDesc")}</div>
          <button className={styles.inviteBtn} onClick={handleInvite}>
            {t("inviteFriends")}
          </button>
        </div>

        {/* Карточка: Бесплатные запросы */}
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
                // TODO: вызвать API за получение награды
                alert(t("freeRequestsUnlocked"));
              }}
            >
              {t("getReward")}
            </button>
          )}
        </div>

        {/* Карточка: Разблокируй Premium */}
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
                // TODO: вызвать API за разблокировку премиума
                alert(t("premiumUnlocked"));
              }}
            >
              {t("getReward")}
            </button>
          )}
        </div>

        {/* Список приглашённых */}
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

        {/* Уведомление о копировании */}
        {copied && (
          <div className={styles.copiedToast}>
            {t("linkCopied", "Ссылка скопирована!")}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};