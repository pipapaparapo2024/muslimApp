import { PageWrapper } from "../../../shared/PageWrapper";
import React from "react";
import styles from "./History.module.css";
import { useHistoryStore } from "../../../hooks/useHistoryStore";
import { HistoryEmpty } from "./historyEmpty/HistoryEmpty";
import { Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const History: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { history } = useHistoryStore();
  const navigate = useNavigate();

  // Функция форматирования даты с переводом
  const formatDateWithTranslation = (dateString: string) => {
    const date = new Date(dateString);

    // Форматирование обычной даты
    if (i18n.language === "ar") {
      // Арабский формат: день месяц год
      return `${date.getDate()} ${t(
        getMonthKey(date.getMonth())
      )} ${date.getFullYear()}`;
    } else {
      // Английский формат: месяц день, год
      return `${t(
        getMonthKey(date.getMonth())
      )} ${date.getDate()}, ${date.getFullYear()}`;
    }
  };

  const getMonthKey = (monthIndex: number): string => {
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    return months[monthIndex];
  };

  // Группируем запросы по датам с правильным форматированием
  const groupedHistory = Object.entries(
    history.reduce((acc, item) => {
      const dateKey = new Date(item.timestamp).toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, typeof history>)
  ).map(([dateKey, promises]) => ({
    date: formatDateWithTranslation(dateKey),
    promises,
  }));

  const handleShare = (event: React.MouseEvent, promisId: string) => {
    event.stopPropagation();
    navigate(`/qna/shareHistory/${promisId}`);
  };

  const handleBlockClick = (promisId: string) => {
    navigate(`/qna/history/${promisId}`, {
      state: {
        question: history.find((item) => item.id === promisId)?.question,
        answer: history.find((item) => item.id === promisId)?.answer,
      },
    });
  };

  if (history.length === 0) return <HistoryEmpty />;

  return (
    <PageWrapper navigateTo="/qna" showBackButton>
      <div className={styles.container}>
        {groupedHistory.map(({ date, promises }) => (
          <div key={date} className={styles.dateSection}>
            <div className={styles.dateHeader}>{date}</div>
            {promises.map((promis) => (
              <div
                key={promis.id}
                onClick={() => handleBlockClick(promis.id)}
                className={styles.blockPromis}
              >
                <div className={styles.questionPromis}>{promis.question}</div>
                <div className={styles.answerPromis}>{promis.answer}</div>
                <button
                  onClick={(event) => handleShare(event, promis.id)}
                  className={styles.share}
                >
                  <Share2 size={16} strokeWidth={2} />
                  {t("share")}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
