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

  return (
    <PageWrapper Navigate="/qna" showBackButton title="Product Scanner">
      {Object.entries(groupedHistory).map(([date, promises]) => (
        <div className={styles.container}>
          <div className={styles.dateHeader}>{date}</div>
          {promises.map((promis) => (
            <div
              onClick={() => navigate('/quran/historyy')}
              // onClick={() =>
              //   navigate(`/quran/history/${promis.id}`, {
              //     state: {
              //       question: promis.question,
              //       answer: promis.answer,
              //     },
              //   })
              // }
              className={styles.blockPromis}
            >
              <div className={styles.questionPromis}>{promis.question}</div>
              <div className={styles.answerPromis}>{promis.answer}</div>
              <button
                onClick={() => console.log("share")}
                className={styles.share}
              >
                <Share2 size={16} strokeWidth={1.5} />
                Share
              </button>
            </div>
          ))}
        </div>
      ))}
    </PageWrapper>
  );
};
