import React, { useEffect, useState } from "react";
import styles from "./HistoryDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { Copy } from "lucide-react";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Share } from "../../../../components/share/Share";
import { t } from "i18next";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { type QaItem } from "../../../../hooks/useHistoryStore";

export const HistoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getHistoryItem } = useHistoryStore();
  const [currentItem, setCurrentItem] = useState<QaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        setIsLoading(false);
        setError("ID не указан");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const item = await getHistoryItem(id);
        
        if (item) {
          setCurrentItem(item);
        } else {
          setError("Запрос не найден");
        }
      } catch (error) {
        console.error("Error loading history item:", error);
        setError("Ошибка загрузки запроса");
      } finally {
        setIsLoading(false);
      }
    };

    loadItem();
  }, [id, getHistoryItem]);

  console.log("id", id);
  console.log("currentItem", currentItem);

  const handleCopy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("✅ Текст скопирован в буфер обмена");
      })
      .catch((err) => {
        console.error("Ошибка при копировании: ", err);
        alert("❌ Не удалось скопировать текст");
      });
  };

  if (isLoading) {
    return (
      <PageWrapper showBackButton={true} styleHave={true}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <div>Загрузка вопроса...</div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !currentItem) {
    return (
      <PageWrapper showBackButton={true} styleHave={true}>
        <div className={styles.errorContainer}>
          <div>{error || "Запрос не найден"}</div>
          <div>ID: {id}</div>
          <button 
            onClick={() => window.history.back()}
            className={styles.backButton}
          >
            Назад
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} navigateTo="/qna/history" >
      <div className={styles.container}>
        <TableRequestsHistory text="/qna/history" />
        <div className={styles.blockMessages}>
          <div className={styles.blockMessageUser}>
            <div className={styles.nickName}>{t("you")}</div>
            <div className={styles.text}>{currentItem.question}</div>
          </div>
          <div className={styles.blockMessageBot}>
            <div className={styles.nickName}>@MuslimBot</div>
            <div className={styles.text}>{currentItem.answer}</div>
            <div
              className={styles.copy}
              onClick={() => handleCopy(currentItem.answer)}
            >
              <Copy size={20} strokeWidth={1.5} />
              {t("copy")}
            </div>
          </div>
        </div>

        <Share shareUrl={`/qna/shareHistory/${id}`} newUrl="/qna" />
      </div>
    </PageWrapper>
  );
};