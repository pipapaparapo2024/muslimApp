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
  console.log("pagination.hasnext", pagination.hasNext);
  console.log("pagination.hasPrev", pagination.hasPrev);

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
          <ul className={styles.pagination}>
            <li className={`${!pagination.hasPrev ? styles.disabled : ""}`}>
              <button
                className={styles.pageButton}
                onClick={async () => {
                  if (pagination.hasPrev) {
                    await loadPrevHistory();
                  }
                }}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft size={24} />
              </button>
            </li>

            <li className={styles.pageDots}>
              {Array.from({ length: pagination.pageAmount }).map((_, index) => (
                <span
                  key={index}
                  className={`${styles.dot} ${
                    pagination.page === index + 1 ? styles.activeDot : ""
                  }`}
                >
                  •
                </span>
              ))}
            </li>

            <li className={` ${!pagination.hasNext ? styles.disabled : ""}`}>
              <button
                className={styles.pageButton}
                onClick={async () => {
                  if (pagination.hasNext) {
                    await loadMoreHistory();
                  }
                }}
                disabled={!pagination.hasNext}
              >
                <ChevronRight size={24} />
              </button>
            </li>
          </ul>
        </div>
      )}
    </PageWrapper>
  );
};
