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
import { type SearchHistoryItem } from "../../../../hooks/useHistoryStore";

export const HistoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { history, fetchHistory, getHistoryItem } = useHistoryStore();
  const [currentItem, setCurrentItem] = useState<SearchHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const localItem = history.find((item) => item.id === id);
        
        if (localItem) {
          setCurrentItem(localItem);
          setIsLoading(false);
          return;
        }

        // Если не найдено локально, загружаем с сервера
        const item = await getHistoryItem(id);
        
        if (item) {
          setCurrentItem(item);
          // Добавляем в локальную историю для кэширования
          if (history.length > 0) {
            useHistoryStore.setState((state) => ({
              history: [...state.history, item],
            }));
          }
        } else {
          // Если не удалось получить по ID, загружаем всю историю
          if (history.length === 0) {
            await fetchHistory();
            const foundInFullHistory = history.find((item) => item.id === id);
            setCurrentItem(foundInFullHistory || null);
          }
        }
      } catch (error) {
        console.error("Error loading history item:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItem();
  }, [id, history, fetchHistory, getHistoryItem]);

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
      <PageWrapper>
        <LoadingSpinner />
        <div>Загрузка вопроса...</div>
      </PageWrapper>
    );
  }

  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true} styleHave={true}>
        <div>Запрос не найден (ID: {id})</div>
        <button onClick={() => window.history.back()}>Назад</button>
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

        <Share shareUrl={`/qna/shareHistory/${id}`} newUrl="/qna" />
      </div>
    </PageWrapper>
  );
};