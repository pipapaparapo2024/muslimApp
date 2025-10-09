import React, { useEffect, useState } from "react";
import styles from "./HistoryScannerDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { Share } from "../../../../components/share/Share";
import { useNavigate, useParams } from "react-router-dom";
import { useHistoryScannerStore } from "../../../../hooks/useHistoryScannerStore";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import {
  getStatusIcon,
  getStatusClassName,
  getStatusTranslationKey,
} from "../../productStatus";
import { type ScanResult } from "../../../../hooks/useScannerStore";
import { useTranslationsStore } from "../../../../hooks/useTranslations";

export const HistoryScannerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { fetchHistoryItem } = useHistoryScannerStore();
  const [currentItem, setCurrentItem] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const { translations } = useTranslationsStore();

  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        navigate("/scanner");
        return;
      }

      setIsLoading(true);
      setNetworkError(null);

      try {
        const item = await fetchHistoryItem(id);

        if (item) {
          setCurrentItem(item);
        } else {
          // Поиск в локальной истории
          const { history } = useHistoryScannerStore.getState();
          const allScans = history.flatMap((group) => group.qa);
          const localItem = allScans.find((scan) => scan.id === id);

          if (localItem) {
            setCurrentItem(localItem);
          } else {
            setNetworkError("Элемент не найден в истории");
            setTimeout(() => navigate("/scanner"), 2000);
          }
        }
      } catch (error: any) {
        console.error("API Error:", error);
        const errorMessage = error.message || "Network error";
        setNetworkError(errorMessage);
      }

      setIsLoading(false);
    };

    loadItem();
  }, [id, navigate, fetchHistoryItem]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (networkError) {
    return (
      <PageWrapper showBackButton={true} navigateTo="/scanner/historyScanner">
        <div className={styles.errorContainer}>
          <h2>{translations?.networkError || "Network Error"}</h2>
          <p>{networkError}</p>
          <button onClick={handleRetry}>
            {translations?.tryAgain || "Try again"}
          </button>
        </div>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <PageWrapper showBackButton={true} navigateTo="/scanner/historyScanner">
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true} navigateTo="/scanner/historyScanner">
        <div>{translations?.itemNotFound || "Item not found"}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} navigateTo="/scanner/historyScanner">
      <div className={styles.container}>
        <TableRequestsHistory text="/scanner/historyScanner" />

        <div className={styles.blockScan}>
          <div
            className={`${styles.accessBlock} ${getStatusClassName(
              currentItem.engType,
              styles
            )}`}
          >
            {getStatusIcon(currentItem.engType)}
            {translations?.[getStatusTranslationKey(currentItem.engType)] ||
              getStatusTranslationKey(currentItem.engType)}
          </div>

          {currentItem.products && currentItem.products.length > 0 && (
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>
                {translations?.ingredients || "Ingredients"}
              </div>
              <div className={styles.scanDesk}>
                {currentItem.products.join(", ")}
              </div>
            </div>
          )}

          {currentItem.haramProducts &&
            currentItem.haramProducts.length > 0 && (
              <div className={styles.blockInside}>
                <div className={styles.scanTitle}>
                  {translations?.analysisResult || "Analysis result"}
                </div>
                <div className={styles.scanDesk}>
                  {currentItem.haramProducts.map(
                    (product: any, index: number) => (
                      <div key={index} className={styles.productItem}>
                        <strong>{product.name}</strong> - {product.reason}{" "}
                        {product.source}
                        {index < currentItem.haramProducts.length - 1 && <br />}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {currentItem.description && (
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>
                {translations?.conclusion || "Conclusion"}
              </div>
              <div className={styles.scanDesk}>{currentItem.description}</div>
            </div>
          )}
        </div>

        <Share
          shareUrl={`/scanner/ScannerShareHistory/${id}`}
          newUrl="/scanner"
          shareText={translations?.share || "Share"}
          newText={translations?.newScan || "New scan"}
        />
      </div>
    </PageWrapper>
  );
};
