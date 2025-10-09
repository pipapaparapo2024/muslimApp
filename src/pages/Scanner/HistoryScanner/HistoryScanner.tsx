import React, { useEffect } from "react";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./HistoryScanner.module.css";
import {
  useHistoryScannerStore,
  historyUtils,
} from "../../../hooks/useHistoryScannerStore";
import { HistoryScannerEmpty } from "./historyScannerEmpty/HistoryScannerEmpty";
import { Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import {
  getStatusIcon,
  getStatusClassName,
  getStatusTranslationKey,
} from "../productStatus";
import { useTranslationsStore } from "../../../hooks/useTranslations";

export const HistoryScanner: React.FC = () => {
  const {
    history,
    isLoading,
    fetchHistory,
    totalPages,
    hasNext,
    hasPrev,
    currentPage,
  } = useHistoryScannerStore();
  const navigate = useNavigate();
  const { translations } = useTranslationsStore();

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const groupedHistory = history ? historyUtils.groupByDate(history) : [];
  console.log("hasNext",hasNext)
  console.log("hasPrev",hasPrev)
  const formatDateWithTranslation = (dateString: string) => {
    const date = new Date(dateString);

    // Определяем текущий язык (можно хранить в translations или глобальном сторе)
    const lang = translations?.lang || "en";

    if (lang === "ar") {
      return `${date.getDate()} ${
        translations?.[getMonthKey(date.getMonth())]
      } ${date.getFullYear()}`;
    } else {
      return `${
        translations?.[getMonthKey(date.getMonth())]
      } ${date.getDate()}, ${date.getFullYear()}`;
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

  const handleShare = (event: React.MouseEvent, scanId: string) => {
    event.stopPropagation();
    navigate(`/scanner/ScannerShareHistory/${scanId}`);
  };

  const handleScanClick = (scanId: string) => {
    navigate(`/scanner/historyScanner/${scanId}`);
  };

  if (isLoading) {
    return (
      <PageWrapper navigateTo="/scanner" showBackButton>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (history.length === 0) return <HistoryScannerEmpty />;

  return (
    <PageWrapper navigateTo="/scanner" showBackButton>
      <div className={styles.container}>
        {groupedHistory.map(({ date, scans }) => (
          <div key={date} className={styles.dateSection}>
            <div className={styles.dateHeader}>
              {formatDateWithTranslation(date)}
            </div>

            {scans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => handleScanClick(scan.id)}
                className={styles.blockScan}
              >
                <div>
                  <div className={styles.scanTitle}>
                    {translations?.ingredients}
                  </div>
                  <div className={styles.scanDesk}>
                    {scan.products.join(", ")}
                  </div>
                </div>

                {scan.haramProducts && scan.haramProducts.length > 0 && (
                  <div className={styles.scanAnalysis}>
                    <div className={styles.scanTitle}>
                      {translations?.analysisResult}
                    </div>
                    <div className={styles.scanDesk}>
                      {scan.haramProducts.map((item, index) => (
                        <React.Fragment key={index}>
                          <strong>{item.name}</strong> - {item.reason} (
                          {item.source})
                          {index < scan.haramProducts.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {scan.description && (
                  <div>
                    <div className={styles.scanTitle}>
                      {translations?.conclusion}
                    </div>
                    <div className={styles.scanDesk}>{scan.description}</div>
                  </div>
                )}

                <div className={styles.blockUnderInfo}>
                  <div
                    className={`${styles.accessBlock} ${getStatusClassName(
                      scan.engType,
                      styles
                    )}`}
                  >
                    {getStatusIcon(scan.engType, 16)}
                    {translations?.[getStatusTranslationKey(scan.engType)]}
                  </div>
                  <button
                    onClick={(event) => handleShare(event, scan.id)}
                    className={styles.share}
                  >
                    <Share2 size={16} strokeWidth={2} />
                    {translations?.share}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      ываыаываывраиылавр
      {totalPages > 1 && (
        <nav
          aria-label="Навигация по страницам"
          className={styles.paginationContainer}
        >
          <ul className={styles.pagination}>
            {/* Кнопка "Предыдущая" */}
            <li
              className={`${styles.pageItem} ${
                !hasPrev ? styles.disabled : ""
              }`}
            >
              <button
                className={styles.pageButton}
                onClick={async () => {
                  if (hasPrev) {
                    await fetchHistory(currentPage - 1);
                  }
                }}
                disabled={!hasPrev}
              >
                ◀
              </button>
            </li>

            {/* Точки между кнопками */}
            <li className={styles.pageDots}>
              {Array.from({ length: totalPages }).map((_, index) => (
                <span
                  key={index}
                  className={`${styles.dot} ${
                    currentPage === index + 1 ? styles.activeDot : ""
                  }`}
                >
                  •
                </span>
              ))}
            </li>

            {/* Кнопка "Следующая" */}
            <li
              className={`${styles.pageItem} ${
                !hasNext ? styles.disabled : ""
              }`}
            >
              <button
                className={styles.pageButton}
                onClick={async () => {
                  if (hasNext) {
                    await fetchHistory(currentPage + 1);
                  }
                }}
                disabled={!hasNext}
              >
                ▶
              </button>
            </li>
          </ul>
        </nav>
      )}
    </PageWrapper>
  );
};
