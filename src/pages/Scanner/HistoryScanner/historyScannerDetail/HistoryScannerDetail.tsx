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
import { trackButtonClick } from "../../../../api/analytics";
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
          // 📊 Аналитика: успешный просмотр деталей скана
          trackButtonClick("view_scanner_detail_screen", {
            scan_id: id,
            eng_type: item.engType,
            has_haram: (item.haramProducts?.length || 0) > 0,
            products_count: item.products?.length || 0,
          });
        } else {
          // Поиск в локальной истории
          const { history } = useHistoryScannerStore.getState();
          const allScans = history.flatMap((group) => group.qa);
          const localItem = allScans.find((scan) => scan.id === id);

          if (localItem) {
            setCurrentItem(localItem);
            trackButtonClick("view_scanner_detail_screen", {
              scan_id: id,
              eng_type: localItem.engType,
              has_haram: (localItem.haramProducts?.length || 0) > 0,
              products_count: localItem.products?.length || 0,
              source: "local_fallback",
            });
          } else {
            setNetworkError("Элемент не найден в истории");
            trackButtonClick("scanner_detail_not_found", { scan_id: id });
            setTimeout(() => navigate("/scanner"), 2000);
          }
        }
      } catch (error: any) {
        console.error("API Error:", error);
        const errorMessage = error.message || "Network error";
        setNetworkError(errorMessage);

        let errorCode = "unknown";
        if (error.response?.status === 403) {
          setNetworkError("Доступ запрещен (403). Возможно ограничение по IP");
          errorCode = "403";
        } else if (error.response?.status === 401) {
          setNetworkError("Неавторизованный доступ (401)");
          errorCode = "401";
        } else if (error.response?.status === 404) {
          setNetworkError("Элемент не найден (404)");
          errorCode = "404";
        }

        // 📊 Аналитика: ошибка загрузки деталей
        trackButtonClick("scanner_detail_load_failed", {
          scan_id: id,
          error_code: errorCode,
          error_message: errorMessage,
        });
      }

      setIsLoading(false);
    };

    loadItem();
  }, [id, navigate, fetchHistoryItem]);

  const handleRetry = () => {
    trackButtonClick("retry_scanner_detail_load", { scan_id: id });
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
              <div className={styles.scanDesk}>
                {currentItem.description}
              </div>
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
