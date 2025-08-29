import { PageWrapper } from "../../../shared/PageWrapper";
import React, { useEffect } from "react";
import styles from "./HistoryScanner.module.css";
import { useHistoryStore } from "../../../hooks/useHistoryScannerStore";
import { HistoryScannerEmpty } from "./historyScannerEmpty/HistoryScannerEmpty";
import { Share2, CircleCheck, CircleX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { historyUtils } from "../../../hooks/useHistoryScannerStore";

export const HistoryScanner: React.FC = () => {
  const { history, isLoading, fetchHistory } = useHistoryStore();
  const navigate = useNavigate();
  useEffect(() => {
    // Загружаем данные только если история пустая
    if (history.length === 0) {
      fetchHistory();
    }
  }, [fetchHistory, history.length]); // ← Правильные зависимости

  // Группируем историю по датам
  const groupedHistory = historyUtils.groupByDate(history);

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
        {Object.entries(groupedHistory).map(([date, scans]) => (
          <div key={date} className={styles.dateSection}>
            <div className={styles.dateHeader}>{date}</div>
            {scans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => handleScanClick(scan.id)}
                className={styles.blockScan}
              >
                <div>
                  <div className={styles.scanTitle}>Ingredients</div>
                  <div className={styles.scanDesk}>{scan.composition}</div>
                </div>
                <div className={styles.scanAnalysis}>
                  <div className={styles.scanTitle}>Analysis Result</div>
                  <div className={styles.scanDesk}>{scan.analysis}</div>
                </div>
                <div className={styles.blockUnderInfo}>
                  {scan.result == true ? (
                    <div className={`${styles.accessBlock} ${styles.haram}`}>
                      <CircleX size={16} strokeWidth={2} /> Haram
                    </div>
                  ) : (
                    <div className={`${styles.accessBlock} ${styles.halal}`}>
                      <CircleCheck size={16} strokeWidth={2} />
                      Halal
                    </div>
                  )}
                  <button
                    onClick={(event) => handleShare(event, scan.id)}
                    className={styles.share}
                  >
                    <Share2 size={16} strokeWidth={2} />
                    Share
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
