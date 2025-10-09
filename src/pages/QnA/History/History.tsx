import { PageWrapper } from "../../../shared/PageWrapper";
import React, { useEffect, useState } from "react";
import styles from "./History.module.css";
import { useHistoryStore } from "../../../hooks/useHistoryStore";
import { HistoryEmpty } from "./historyEmpty/HistoryEmpty";
import { Share2, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { useTranslationsStore } from "../../../hooks/useTranslations";
export const History: React.FC = () => {
  const { i18n } = useTranslation();
  const {
    history,
    fetchHistory,
    loadMoreHistory,
    loading,
    pagination,
    loadPrevHistory,
  } = useHistoryStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { translations } = useTranslationsStore();
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

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return date.toLocaleDateString(i18n.language, options);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return dateString;
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
                  {translations?.share}
                </button>
              </div>
            ))}
          </div>
        ))}

        <div className={styles.paginationInfo}>
          {pagination.page < pagination.pageAmount && translations?.page}
          {pagination.page} {pagination.pageAmount}
        </div>
      </div>
      {pagination.pageAmount > 1 && (
        <div
          aria-label="Навигация по страницам"
          className={styles.paginationContainer}
        >
          <button
            className={`${styles.pageButton} ${
              !pagination.hasNext ? styles.disabled : ""
            }`}
            onClick={async () => {
              if (pagination.hasPrev) {
                await loadPrevHistory();
              }
            }}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft size={24} />
          </button>

          <ul className={styles.pagination}>
            {Array.from({ length: pagination.pageAmount }).map((_, index) => (
              <li
                className={`${styles.dot} ${
                  pagination.page === index + 1 ? styles.activeDot : ""
                }`}
              ></li>
            ))}
          </ul>

          <button
            className={`${styles.pageButton}  ${
              !pagination.hasNext ? styles.disabled : ""
            }`}
            onClick={async () => {
              if (pagination.hasNext) {
                await loadMoreHistory();
                console.log("history",history)
              }
            }}
            disabled={!pagination.hasNext}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </PageWrapper>
  );
};
