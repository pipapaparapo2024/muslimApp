import { PageWrapper } from "../../../shared/PageWrapper";
import React, { useEffect } from "react";
import styles from "./HistoryScanner.module.css";
import { useHistoryStore } from "../../../hooks/useHistoryScannerStore";
import { HistoryScannerEmpty } from "./historyScannerEmpty/HistoryScannerEmpty";
import { Share2, CircleCheck, CircleX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { historyUtils } from "../../../hooks/useHistoryScannerStore";
import { useTranslation } from "react-i18next";

export const HistoryScanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { history, isLoading, fetchHistory } = useHistoryStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const formatDateWithTranslation = (dateString: string) => {
    const date = new Date(dateString);
    
    if (i18n.language === "ar") {
      // Арабский формат: день месяц год
      return `${date.getDate()} ${t(getMonthKey(date.getMonth()))} ${date.getFullYear()}`;
    } else {
      // Английский формат: месяц день, год
      return `${t(getMonthKey(date.getMonth()))} ${date.getDate()}, ${date.getFullYear()}`;
    }
  };

  const getMonthKey = (monthIndex: number): string => {
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december",
    ];
    return months[monthIndex];
  };

  const groupedHistory = Object.entries(historyUtils.groupByDate(history)).map(
    ([dateKey, scans]) => ({
      date: formatDateWithTranslation(dateKey),
      scans,
    })
  );

  const handleShare = (event: React.MouseEvent, scanId: string) => {
    event.stopPropagation();
    navigate(`/scanner/ScannerShareHistory/${scanId}`);
  };

  const handleScanClick = (scanId: string) => {
    navigate(`/scanner/historyScanner/${scanId}`);
  };

  const isHaram = (qaItem: any): boolean => {
    return qaItem.haranProducts?.some((product: any) => product.isHaran) || false;
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
            <div className={styles.dateHeader}>{date}</div>
            {scans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => handleScanClick(scan.id)}
                className={styles.blockScan}
              >
                <div>
                  <div className={styles.scanTitle}>{t("product")}</div>
                  <div className={styles.scanDesk}>{scan.name}</div>
                </div>
                <div className={styles.scanAnalysis}>
                  <div className={styles.scanTitle}>{t("description")}</div>
                  <div className={styles.scanDesk}>{scan.description}</div>
                </div>
                <div className={styles.blockUnderInfo}>
                  {isHaram(scan) ? (
                    <div className={`${styles.accessBlock} ${styles.haram}`}>
                      <CircleX size={16} strokeWidth={2} /> {t("haram")}
                    </div>
                  ) : (
                    <div className={`${styles.accessBlock} ${styles.halal}`}>
                      <CircleCheck size={16} strokeWidth={2} />
                      {t("halal")}
                    </div>
                  )}
                  <button
                    onClick={(event) => handleShare(event, scan.id)}
                    className={styles.share}
                  >
                    <Share2 size={16} strokeWidth={2} />
                    {t("share")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};