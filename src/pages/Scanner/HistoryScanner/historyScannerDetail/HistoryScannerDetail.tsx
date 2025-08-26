import React from "react";
import styles from "./HistoryScannerDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { CircleCheck, CircleX, Plus, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useHistoryStore } from "../HistoryScannerStore";

export const HistoryScannerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { history } = useHistoryStore();
  const currentItem = history.find((item) => item.id === id);

  const handleShare = () => {
    if (!currentItem) return;
    navigate(`/scanner/ScannerShareHistory/${id}`);
  };
  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true}>
        <div>Запрос не найден</div>
      </PageWrapper>
    );
  }
  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        <TableRequestsHistory text="/scanner/historyScanner" />
        <div className={styles.blockScan}>
          <div className={styles.blockAccess}>
            {currentItem.result == true ? (
              <div className={`${styles.accessBlock} ${styles.haram}`}>
                <CircleX size={24} strokeWidth={1.5} /> Haram
              </div>
            ) : (
              <div className={`${styles.accessBlock} ${styles.halal}`}>
                <CircleCheck size={24} strokeWidth={1.5} />
                Halal
              </div>
            )}
          </div>
          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>Ingredients</div>
            <div className={styles.scanDesk}>{currentItem.composition}</div>
          </div>
          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>Analysis Result</div>
            <div className={styles.scanDesk}>{currentItem.analysis}</div>
          </div>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <button
            type="submit"
            className={styles.submitButton}
            onClick={handleShare}
          >
            <Upload strokeWidth={1.5} /> Share
          </button>
          <button
            type="submit"
            className={styles.questionButton}
            onClick={() => navigate("/scanner")}
          >
            <Plus strokeWidth={1.5} /> New Scan
          </button>
        </form>
      </div>
    </PageWrapper>
  );
};
