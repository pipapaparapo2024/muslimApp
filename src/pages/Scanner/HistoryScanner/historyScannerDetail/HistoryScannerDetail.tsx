import React, { useEffect, useState } from "react";
import styles from "./HistoryScannerDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { CircleCheck, CircleX } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useHistoryStore } from "../HistoryScannerStore";
import { useScannerStore } from "../../../../hooks/useScannerStore";
import { Share } from "../../../../components/share/Share";

interface HistoryScannerDetailProps {
  result?: any;
}

export const HistoryScannerDetail: React.FC<HistoryScannerDetailProps> = ({
  result,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { history } = useHistoryStore();
  const { scanResult } = useScannerStore();
  const [currentItem, setCurrentItem] = useState<any>(null);

  useEffect(() => {
    // Приоритет 1: Если передан пропс result (для прямого использования)
    if (result) {
      setCurrentItem(result);
      return;
    }

    // Приоритет 2: Если есть результат из scanner store (только что отсканировано)
    if (scanResult && scanResult.id === id) {
      setCurrentItem(scanResult);
      return;
    }

    // Приоритет 3: Пытаемся получить из sessionStorage (для навигации после сканирования)
    const lastScanResult = sessionStorage.getItem('lastScanResult');
    if (lastScanResult) {
      const parsedResult = JSON.parse(lastScanResult);
      if (parsedResult.id === id) {
        setCurrentItem(parsedResult);
        sessionStorage.removeItem('lastScanResult');
        return;
      }
    }

    // Приоритет 4: Ищем в истории
    const historyItem = history.find((item) => item.id === id);
    if (historyItem) {
      setCurrentItem(historyItem);
      return;
    }

    // Если ничего не найдено, возвращаем на главную
    navigate("/scanner");
  }, [id, result, scanResult, history, navigate]);

  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true}>
        <div>Loading...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        <TableRequestsHistory text="/scanner/historyScanner" />
        <div className={styles.blockScan}>
          <div className={styles.blockAccess}>
            {currentItem.status === "haram" ? (
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
            <div className={styles.scanTitle}>Product Name</div>
            <div className={styles.scanDesk}>{currentItem.productName}</div>
          </div>
          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>Ingredients</div>
            <div className={styles.scanDesk}>
              {currentItem.ingredients?.map((ing: any, index: number) => (
                <div key={index} className={styles.ingredientItem}>
                  <span className={styles.ingredientName}>{ing.name}:</span>
                  <span className={styles[ing.status]}>{ing.status}</span>
                  <span className={styles.ingredientDesc}> - {ing.description}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>Analysis Result</div>
            <div className={styles.scanDesk}>
              Confidence: {currentItem.confidence}%
            </div>
          </div>
        </div>
        
        {/* Используем отдельный компонент Share */}
        <Share 
          shareUrl={`/scanner/ScannerShareHistory/${id}`}
          newUrl="/scanner"
          shareText="Share"
          newText="New Scan"
        />
      </div>
    </PageWrapper>
  );
};

