import React, { useEffect } from "react";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./HistoryScanner.module.css";
import { useHistoryScannerStore, historyUtils } from "../../../hooks/useHistoryScannerStore";
import { HistoryScannerEmpty } from "./historyScannerEmpty/HistoryScannerEmpty";
import { Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { useTranslation } from "react-i18next";
import {
  getStatusIcon,
  getStatusClassName,
  getStatusTranslationKey,
} from "../productStatus";
import { type ProductStatusType } from "../../../hooks/useScannerStore";

const toProductStatusType = (status: string): ProductStatusType => {
  const validStatuses: ProductStatusType[] = [
    "halal",
    "haram",
    "mushbooh",
    "needs_info",
  ];
  return validStatuses.includes(status as ProductStatusType)
    ? (status as ProductStatusType)
    : "needs_info";
};

const getStatusValue = (statusObj: any): ProductStatusType => {
  if (typeof statusObj === "string") return toProductStatusType(statusObj);

  if (typeof statusObj === "object" && statusObj !== null) {
    if (statusObj.status) return toProductStatusType(statusObj.status);
    if (statusObj.value) return toProductStatusType(statusObj.value);
    if (statusObj.name) return toProductStatusType(statusObj.name);

    const statusKeys = Object.keys(statusObj);
    for (const key of statusKeys) {
      if (statusObj[key] && typeof statusObj[key] === "string") {
        return toProductStatusType(statusObj[key]);
      }
    }
  }

  return "needs_info";
};

export const HistoryScanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { history, isLoading, fetchHistory } = useHistoryScannerStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory(1);
    console.log("fetchHistory");
  }, []);

  const formatDateWithTranslation = (dateString: string) => {
    const date = new Date(dateString);

    if (i18n.language === "ar") {
      return `${date.getDate()} ${t(
        getMonthKey(date.getMonth())
      )} ${date.getFullYear()}`;
    } else {
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

  console.log("history", history);
  if (history.length === 0) return <HistoryScannerEmpty />;

  return (
    <PageWrapper navigateTo="/scanner" showBackButton>
      <div className={styles.container}>
        {groupedHistory.map(({ date, scans }) => (
          <div key={date} className={styles.dateSection}>
            <div className={styles.dateHeader}>{formatDateWithTranslation(date)}</div>
            {scans.map((scan) => {
              const status = getStatusValue(scan.verdict);
              return (
                <div
                  key={scan.id}
                  onClick={() => handleScanClick(scan.id)}
                  className={styles.blockScan}
                >
                  <div>
                    <div className={styles.scanTitle}>{t("ingredients")}</div>
                    <div className={styles.scanDesk}>
                      {scan.products.join(", ") || t("unknownProduct")}
                    </div>
                  </div>
                  <div className={styles.scanAnalysis}>
                    <div className={styles.scanTitle}>
                      {t("analysisResult")}
                    </div>
                    <div className={styles.scanDesk}>
                      {scan.haramProducts?.map((item) => item.reason).join(", ") || 
                       t("noDescription")}
                    </div>
                  </div>
                  <div className={styles.blockUnderInfo}>
                    <div
                      className={`${styles.accessBlock} ${getStatusClassName(
                        status,
                        styles
                      )}`}
                    >
                      {getStatusIcon(status, 16)}
                      {t(getStatusTranslationKey(status))}
                    </div>
                    <button
                      onClick={(event) => handleShare(event, scan.id)}
                      className={styles.share}
                    >
                      <Share2 size={16} strokeWidth={2} />
                      {t("share")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};