import React, { useEffect, useState } from "react";
import styles from "./HistoryScannerDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { Share } from "../../../../components/share/Share";
import { useNavigate, useParams } from "react-router-dom";
import { useHistoryScannerStore } from "../../../../hooks/useHistoryScannerStore";
import { t } from "i18next";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import {
  getStatusIcon,
  getStatusClassName,
  getStatusTranslationKey,
} from "../../productStatus";
import { type ScanResult } from "../../../../hooks/useScannerStore";

export const HistoryScannerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { fetchHistoryItem } = useHistoryScannerStore();
  const [currentItem, setCurrentItem] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);

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
        console.log("API Response item:", item);

        if (item) {
          setCurrentItem(item);
        } else {
          // Если item = null, ищем в локальной истории
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
        setNetworkError(error.message || "Network error");

        if (error.response?.status === 403) {
          setNetworkError("Доступ запрещен (403). Возможно ограничение по IP");
        } else if (error.response?.status === 401) {
          setNetworkError("Неавторизованный доступ (401)");
        } else if (error.response?.status === 404) {
          setNetworkError("Элемент не найден (404)");
        }
      }

      setIsLoading(false);
    };

    loadItem();
  }, [id, navigate, fetchHistoryItem]);

  if (networkError) {
    return (
      <PageWrapper showBackButton={true} navigateTo="/scanner/historyScanner">
        <div className={styles.errorContainer}>
          <h2>Ошибка сети</h2>
          <p>{networkError}</p>
          <button onClick={() => window.location.reload()}>
            Попробовать снова
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
        <div>{t("itemNotFound")}</div>
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
            {t(getStatusTranslationKey(currentItem.engType))}
          </div>

          {currentItem.products && currentItem.products.length > 0 && (
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("ingredients")}</div>
              <div className={styles.scanDesk}>
                {currentItem.products.join(", ")}
              </div>
            </div>
          )}
          {/* Результаты анализа - ОДИН блок для всех продуктов */}
          {currentItem.haramProducts &&
            currentItem.haramProducts.length > 0 && (
              <div className={styles.blockMessageBot}>
                <div className={styles.scanTitle}>{t("analysisResult")}</div>
                <div className={styles.text}>
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
              <div className={styles.scanTitle}>{t("conclusion")}</div>
              <div className={styles.scanDesk}>{currentItem.description}</div>
            </div>
          )}
        </div>
        <Share
          shareUrl={`/scanner/ScannerShareHistory/${id}`}
          newUrl="/scanner"
          newText={t("newScan")}
        />
      </div>
    </PageWrapper>
  );
};
