import { PageWrapper } from "../../../shared/PageWrapper";
import React, { useEffect, useState } from "react";
import styles from "./History.module.css";
import { useHistoryStore } from "../../../hooks/useHistoryStore";
import { HistoryEmpty } from "./historyEmpty/HistoryEmpty";
import { Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";

export const History: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { history, fetchHistory, loading } = useHistoryStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        await fetchHistory();
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [fetchHistory]);

  // Функция для форматирования даты из ISO формата
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return dateString; // Возвращаем оригинальную строку если дата невалидна
      }

      // Опции для форматирования даты
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };

      // Форматируем дату в зависимости от языка
      return date.toLocaleDateString(i18n.language, options);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return dateString; // Возвращаем оригинальную строку в случае ошибки
    }
  };

  const handleShare = (event: React.MouseEvent, promisId: string) => {
    event.stopPropagation();
    navigate(`/qna/shareHistory/${promisId}`);
  };

  const handleBlockClick = (promisId: string) => {
    navigate(`/qna/history/${promisId}`);
  };

  if (isLoading || loading) {
    return (
      <PageWrapper navigateTo="/qna" showBackButton>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  // Проверяем, есть ли вообще какие-либо QA элементы
  const hasHistory = history.some((day) => day.qa && day.qa.length > 0);

  if (!hasHistory) return <HistoryEmpty />;

  return (
    <PageWrapper navigateTo="/qna" showBackButton>
      <div className={styles.container}>
        {history.map((day) => (
          <div key={day.date} className={styles.dateSection}>
            <div className={styles.dateHeader}>{formatDate(day.date)}</div>
            {day.qa.map((qaItem) => (
              <div
                key={qaItem.id}
                onClick={() => handleBlockClick(qaItem.id)}
                className={styles.blockPromis}
              >
                <div className={styles.questionPromis}>{qaItem.question}</div>
                <div className={styles.answerPromis}>{qaItem.answer}</div>
                <button
                  onClick={(event) => handleShare(event, qaItem.id)}
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
