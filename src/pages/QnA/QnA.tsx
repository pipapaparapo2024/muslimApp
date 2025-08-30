import React, { useEffect, useState } from "react";
import styles from "./QnA.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import thinkPerson from "../../assets/image/question.png";
import { useQnAStore } from "../../hooks/useQnAStore";
import { Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
import { useNavigate } from "react-router-dom";
import { useHistoryStore } from "./History/HistoryStore";
import { useTranslation } from "react-i18next";

export const QnA: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = useQnAStore();
  const { addHistory } = useHistoryStore(); // Используем addHistory вместо addToHistory
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Предзагрузка изображения
  useEffect(() => {
    const img = new Image();
    img.src = thinkPerson;

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      setImageError(true);
      setImageLoaded(true);
      console.error("Failed to load image:", thinkPerson);
    };
  }, []);

  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return isSubmitting ? t("asking") : t("askQuestion");
    }
    return t("buyRequests");
  };

  const showAskButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const questionText = question.trim() || "hello world";

      // Имитируем запрос к API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Генерируем ответ (замените на реальный API вызов)
      const answer = `This is a response to your question: "${questionText}". In a real application, this would come from an AI service.`;

      // Добавляем вопрос и ответ в историю
      const newHistoryItem = addHistory(questionText, answer);

      // Переходим на страницу деталей этого запроса
      navigate(`/qna/history/${newHistoryItem.id}`, {
        state: {
          question: questionText,
          answer: answer,
        },
      });
    } catch (error) {
      console.error("Error asking question:", error);
      alert("Failed to ask question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Пока изображение не загружено — показываем лоадер
  if (!imageLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (imageError) {
    console.log("Using fallback image due to error");
  }

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        <TableRequestsHistory text="/qna/history" />
        {/* Центральный контент */}
        <div className={styles.content}>
          <div className={styles.illustration}>
            <img src={thinkPerson} alt="Ask a question" />
          </div>

          <div className={styles.guidance}>
            <span>{t("needGuidance")}</span>
            <p>
              {t("getClearAnswers")}
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (showAskButton && question.trim()) {
              handleSubmit();
            } else if (!showAskButton) {
              setShowModal(true);
            }
          }}
          className={styles.form}
        >
          <input
            type="text"
            placeholder={t("yourQuestion")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!showAskButton || isSubmitting}
            className={styles.input}
          />
          <button
            type="submit"
            className={styles.submitButton}
            disabled={(showAskButton && !question.trim()) || isSubmitting}
            onClick={!showAskButton ? () => setShowModal(true) : undefined}
          >
            {showAskButton ? "" : <Wallet strokeWidth={1.5} />}
            {getButtonText()}
          </button>
        </form>
      </div>

      <BuyRequestsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedRequests={selectedRequests}
        onSelectRequests={setSelectedRequests}
      />
    </PageWrapper>
  );
};
