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
  needsAttention 
} from "../../productStatus";
import { type ScanResult } from "../../../../hooks/useScannerStore";

export const HistoryScannerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { fetchHistoryItem } = useHistoryScannerStore();
  const [currentItem, setCurrentItem] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        navigate("/scanner");
        return;
      }

      setIsLoading(true);
      const item = await fetchHistoryItem(id);
      
      if (item) {
        setCurrentItem(item);
      } else {
        navigate("/scanner");
      }
      
      setIsLoading(false);
    };

    loadItem();
  }, [id, navigate, fetchHistoryItem]);

  if (isLoading) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner/>
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
          <div className={styles.blockAccess}>
            <div className={`${styles.accessBlock} ${getStatusClassName(currentItem.verdict, styles)}`}>
              {getStatusIcon(currentItem.verdict)}
              {t(getStatusTranslationKey(currentItem.verdict))}
            </div>
          </div>
          
          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>{t("type")}</div>
            <div className={styles.scanDesk}>{currentItem.engType || t("unknownType")}</div>
          </div>

          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>{t("description")}</div>
            <div className={styles.scanDesk}>{currentItem.description || t("noDescription")}</div>
          </div>

          {currentItem.products && currentItem.products.length > 0 && (
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("products")}</div>
              <div className={styles.scanDesk}>
                {currentItem.products.join(", ")}
              </div>
            </div>
          )}

          {currentItem.haramProducts && currentItem.haramProducts.length > 0 && (
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("haramProducts")}</div>
              {currentItem.haramProducts.map((product, index) => (
                <div key={index} className={styles.haranProduct}>
                  <strong>{product.name}:</strong> {product.reason}
                  {product.source && <div><small>{t("source")}: {product.source}</small></div>}
                </div>
              ))}
            </div>
          )}

          {needsAttention(currentItem.verdict) && (
            <div className={styles.attentionBlock}>
              <div className={styles.attentionTitle}>{t("attention")}</div>
              <div className={styles.attentionText}>
                {currentItem.verdict === "mushbooh" 
                  ? t("mushboohWarning")
                  : t("needsInfoWarning")
                }
              </div>
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

