import React, { useEffect, useState } from "react";
import styles from "./HistoryDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { Copy } from "lucide-react";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Share } from "../../../../components/share/Share"; // Импортируйте отдельный компонент
import { t } from "i18next";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";

export const HistoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { history, fetchHistory } = useHistoryStore();
  const [isLoading, setIsLoading] = useState(true);
  const currentItem = history.find((item) => item.id === id);
  useEffect(() => {
    const loadHistory = async () => {
      if (history.length === 0) {
        await fetchHistory();
      }
      setIsLoading(false);
    };

    loadHistory();
  }, [fetchHistory, history.length]);
  console.log("id", id);
  console.log("currentItem", currentItem);
  // Функция копирования текста
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
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  }
  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true} styleHave={true}>
        <div>Запрос не найденываываыва</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={true}>
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

        {/* Используем отдельный компонент Share */}
        <Share shareUrl={`/qna/shareHistory/${id}`} newUrl="/qna" />
      </div>
    </PageWrapper>
  );
};
