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
        console.log("API Response:", item);

        if (item) {
          setCurrentItem(item);
        } else {
          navigate("/scanner");
        }
      } catch (error: any) {
        console.error("API Error:", error);
        setNetworkError(error.message || "Network error");

        // Проверяем статус ошибки
        if (error.response?.status === 403) {
          setNetworkError("Доступ запрещен (403). Возможно ограничение по IP");
        } else if (error.response?.status === 401) {
          setNetworkError("Неавторизованный доступ (401)");
        }
      }

      setIsLoading(false);
    };

    loadItem();
  }, [id, navigate, fetchHistoryItem]);

  // Добавьте отображение ошибки сети
  if (networkError) {
    return (
      <PageWrapper showBackButton={true}>
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
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true}>
        <div>{t("itemNotFound")}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        <TableRequestsHistory text="/scanner/historyScanner" />
        <div className={styles.blockScan}>
          <div
            className={`${styles.accessBlock} ${getStatusClassName(
              currentItem.verdict,
              styles
            )}`}
          >
            {getStatusIcon(currentItem.verdict)}
            {t(getStatusTranslationKey(currentItem.verdict))}
          </div>

          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>{t("ingredients")}</div>
            <div className={styles.scanDesk}>
              {currentItem.products && currentItem.products.length > 0
                ? currentItem.products.join(", ")
                : t("noIngredientsFound")}
            </div>
          </div>

          {currentItem.haramProducts &&
            currentItem.haramProducts.length > 0 && (
              <div className={styles.blockInside}>
                <div className={styles.scanTitle}>{t("analysisResult")}</div>
                {currentItem.haramProducts.map((product, index) => (
                  <div key={index} className={styles.haranProduct}>
                    {product.reason}
                  </div>
                ))}
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
