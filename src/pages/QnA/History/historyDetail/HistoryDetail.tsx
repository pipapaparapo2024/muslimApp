import React, { useEffect, useState } from "react";
import styles from "./HistoryDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { Copy } from "lucide-react";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Share } from "../../../../components/share/Share";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { type QaItem } from "../../../../hooks/useHistoryStore";
import { trackButtonClick } from "../../../../api/analytics";
import { useTranslationsStore } from "../../../../hooks/useTranslations";
export const HistoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { translations } = useTranslationsStore();
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
          // Опционально: трекинг просмотра деталей (если нужно)
          trackButtonClick("view_history_detail_screen", { promis_id: id });
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

  const handleCopy = (text: string) => {
    trackButtonClick("copy_history_answer", {
      promis_id: id,
      text_length: text.length,
    });

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
        <LoadingSpinner />
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
    <PageWrapper showBackButton={true} navigateTo="/qna/history">
      <div className={styles.container}>
        <TableRequestsHistory text="/qna/history" />
        <div className={styles.blockMessages}>
          <div className={styles.blockMessageUser}>
            <div className={styles.nickName}> {translations?.you}</div>
            <div className={styles.text}>{currentItem.question}</div>
          </div>
          <div className={styles.blockMessageBot}>
            <div className={styles.nickName}>@QiblaGuidebot</div>
            <div className={styles.text}>{currentItem.answer}</div>
            <div
              className={styles.copy}
              onClick={() => handleCopy(currentItem.answer)}
            >
              <Copy size={20} strokeWidth={1.5} />
              {translations?.copy}
            </div>
          </div>
        </div>

        <Share
          shareUrl={`/qna/shareHistory/${id}`}
          newUrl="/qna"
          shareText={translations?.share}
          newText={translations?.newQuestion}
        />
      </div>
    </PageWrapper>
  );
};
