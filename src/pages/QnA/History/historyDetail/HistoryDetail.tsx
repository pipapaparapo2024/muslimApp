import React from "react";
import styles from "./HistoryDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { Copy } from "lucide-react";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Share } from "../../../../components/share/Share"; // Импортируйте отдельный компонент
import { t } from "i18next";

export const HistoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { history } = useHistoryStore();
  const currentItem = history.find((item) => item.id === id);

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

  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true} styleHave={true}>
        <div>Запрос не найден</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={true}>
      <div className={styles.container}>
        <TableRequestsHistory text="/qna/history"/>
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
        <Share 
          shareUrl={`/qna/shareHistory/${id}`}
          newUrl="/qna"
        />
      </div>
    </PageWrapper>
  );
};