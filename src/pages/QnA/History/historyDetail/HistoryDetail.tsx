import React from "react";
import styles from "./HistoryDetail.module.css";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../../components/TableRequestsHistory/TableRequestsHistory";
import { Copy, Plus, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useHistoryStore } from "../HistoryStore";

export const HistoryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { history } = useHistoryStore();
  const currentItem = history.find((item) => item.id === id);

  // Функция копирования текста
  const handleCopy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Можно использовать alert или более красивое уведомление
        alert("✅ Текст скопирован в буфер обмена");
      })
      .catch((err) => {
        console.error("Ошибка при копировании: ", err);
        alert("❌ Не удалось скопировать текст");
      });
  };
  const handleShare = () => {
    if (!currentItem) return;
    navigate(`/qna/shareHistory/${id}`);
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
            <div className={styles.nickName}>You</div>
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
              Copy
            </div>
          </div>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <button
            type="submit"
            className={styles.submitButton}
            onClick={handleShare}
          >
            <Upload strokeWidth={1.5} /> Share
          </button>
          <button
            type="submit"
            className={styles.questionButton}
            onClick={() => navigate("/qna")}
          >
            <Plus strokeWidth={1.5} /> New Question
          </button>
        </form>
      </div>
    </PageWrapper>
  );
};
