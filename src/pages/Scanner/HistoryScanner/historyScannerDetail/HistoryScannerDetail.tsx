import React, { useEffect, useState } from "react";
import styles from "./HistoryScannerDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { CircleCheck, CircleX } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useHistoryStore, type QaItem } from "../../../../hooks/useHistoryScannerStore";
import { Share } from "../../../../components/share/Share";
import { t } from "i18next";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";

export const HistoryScannerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { fetchHistoryItem } = useHistoryStore();
  const [currentItem, setCurrentItem] = useState<QaItem | null>(null);
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

  const isHaram = (): boolean => {
    return currentItem?.haranProducts?.some(product => product.isHaran) || false;
  };

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
            {isHaram() ? (
              <div className={`${styles.accessBlock} ${styles.haram}`}>
                <CircleX size={24} strokeWidth={1.5} /> {t("haram")}
              </div>
            ) : (
              <div className={`${styles.accessBlock} ${styles.halal}`}>
                <CircleCheck size={24} strokeWidth={1.5} />
                {t("halal")}
              </div>
            )}
          </div>
          
          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>{t("productName")}</div>
            <div className={styles.scanDesk}>{currentItem.name}</div>
          </div>

          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>{t("type")}</div>
            <div className={styles.scanDesk}>{currentItem.type}</div>
          </div>

          <div className={styles.blockInside}>
            <div className={styles.scanTitle}>{t("description")}</div>
            <div className={styles.scanDesk}>{currentItem.description}</div>
          </div>

          {currentItem.products && currentItem.products.length > 0 && (
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("products")}</div>
              <div className={styles.scanDesk}>
                {currentItem.products.join(", ")}
              </div>
            </div>
          )}

          {currentItem.haranProducts && currentItem.haranProducts.length > 0 && (
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("haranProducts")}</div>
              {currentItem.haranProducts.map((product, index) => (
                <div key={index} className={styles.haranProduct}>
                  <strong>{product.name}:</strong> {product.reason}
                  {product.source && <div><small>{t("source")}: {product.source}</small></div>}
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