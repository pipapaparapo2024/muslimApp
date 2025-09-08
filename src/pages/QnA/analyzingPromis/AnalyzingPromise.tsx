import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageWrapper } from "../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { useQnAStore } from "../../../hooks/useQnAStore";
import { usePremiumStore } from "../../../hooks/usePremiumStore";
import styles from "./AnalyzingPromise.module.css";

export const AnalyzingPromise: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { question } = location.state || {};
  const { askQuestion } = useQnAStore();
  const { fetchUserData } = usePremiumStore();

  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    if (!question) {
      navigate("/qna");
      return;
    }

    const processQuestion = async () => {
      try {
        setTimeout(() => setMinTimePassed(true), 2000);
        const id = await askQuestion(question);

        // Ждем пока пройдет минимум 2 секунды
        while (!minTimePassed) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Обновляем данные пользователя (кол-во запросов и т.д.)
        await fetchUserData();
        navigate(`/qna/history/${id}`);
      } catch (error) {
        console.error("Error asking question:", error);
        if (minTimePassed) {
          navigate("/qna", { state: { error: "Failed to get answer" } });
        }
      }
    };

    processQuestion();
  }, [question, minTimePassed, navigate, askQuestion, fetchUserData]);

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        <LoadingSpinner />
        <div className={styles.text}>Analyzing your question...</div>
        <div className={styles.subtext}>
          Please wait while we process your request
        </div>
      </div>
    </PageWrapper>
  );
};
