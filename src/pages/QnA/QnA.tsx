import React, { useEffect, useState } from "react";
import styles from "./QnA.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import thinkPerson from "../../assets/image/question.png";
import { useQnAStore } from "../../hooks/useQnAStore";
import { Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";

export const QnA: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = useQnAStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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
      setImageLoaded(true); // Чтобы не висеть в лоадинге
      console.error("Failed to load image:", thinkPerson);
    };
  }, []);

  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return "Ask Question";
    }
    return "Buy Requests";
  };

  const showAskButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

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
        <TableRequestsHistory text="/qna/history"/>
        {/* Центральный контент */}
        <div className={styles.content}>
          <div className={styles.illustration}>
            <img src={thinkPerson} alt="Ask a question" />
          </div>

          <div className={styles.guidance}>
            <span>Need Guidance?</span>
            <p>
              Get clear, concise answers to what matters most. Ask and we'll
              respond right here.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <input
            type="text"
            placeholder="Your Question"
            disabled={!showAskButton}
            className={styles.input}
          />
          <button
            type="submit"
            className={styles.submitButton}
            onClick={showAskButton ? () => {} : () => setShowModal(true)}
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
