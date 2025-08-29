import { PageWrapper } from "../../../shared/PageWrapper";
import React from "react";
import styles from "./History.module.css";
import { useHistoryStore } from "./HistoryStore";
import { HistoryEmpty } from "./historyEmpty/HistoryEmpty";
import { Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const History: React.FC = () => {
  const { history } = useHistoryStore();
  const navigate = useNavigate();
  
  if (history.length === 0) return <HistoryEmpty />;

  // Группируем запросы по датам
  const groupedHistory = history.reduce((acc, item) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof history>);

  const handleShare = (event: React.MouseEvent, promisId: string) => {
    event.stopPropagation(); // Останавливаем всплытие
    navigate(`/qna/shareHistory/${promisId}`);
  };

  const handleBlockClick = (promisId: string) => {
    navigate(`/qna/history/${promisId}`, {
      state: {
        question: history.find(item => item.id === promisId)?.question,
        answer: history.find(item => item.id === promisId)?.answer,
      },
    });
  };

  return (
    <PageWrapper navigateTo="/qna" showBackButton>
      {Object.entries(groupedHistory).map(([date, promises]) => (
        <div key={date} className={styles.container}>
          <div className={styles.dateHeader}>{date}</div>
          {promises.map((promis) => (
            <div
              key={promis.id}
              onClick={() => handleBlockClick(promis.id)}
              className={styles.blockPromis}
            >
              <div className={styles.questionPromis}>{promis.question}</div>
              <div className={styles.answerPromis}>{promis.answer}</div>
              <button
                onClick={(event) => handleShare(event, promis.id)}
                className={styles.share}
              >
                <Share2 size={16} strokeWidth={2} />
                Share
              </button>
            </div>
          ))}
        </div>
      ))}
    </PageWrapper>
  );
};