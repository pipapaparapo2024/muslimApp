// src/components/QnA/QnA.tsx
import React, { useEffect, useState } from "react";
import styles from "./QnA.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import thinkPerson from "../../assets/image/get.png";
import wallet from "../../assets/icons/walle.svg";
import { useQnAStore } from "./QnAStore";
import { Clock, MessageCircle } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";

export const QnA: React.FC = () => {
  const { requestsLeft, hasPremium, isLoading, fetchUserData } = useQnAStore();

  useEffect(() => {
    fetchUserData();
  }, []);

  // Определяем текст кнопки и статус
  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return "Ask Question";
    }
    return "Buy Requests";
  };
  const getStatusText = () => {
    if (isLoading) return "Loading...";
    if (hasPremium) return "Have Requests";
    if (requestsLeft != null && requestsLeft > 0)
      return `${requestsLeft} Requests`;
    return "No Requests";
  };
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState(10);

  const showAskButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        {/* Шапка */}
        <div className={styles.header}>
          <button className={styles.button}>
            <div>
              <Clock size={20} strokeWidth={1.5} />
            </div>
            <div>History</div>
          </button>
          <button className={styles.button}>
            <div>
              <MessageCircle size={20} strokeWidth={1.5} />
            </div>
            {isLoading ? "Loading..." : getStatusText()}
          </button>
        </div>

        {/* Иллюстрация */}
        <div className={styles.illustration}>
          <img src={thinkPerson} alt="Ask a question" />
        </div>

        {/* Подсказка */}
        <div className={styles.guidance}>
          <span>Need Guidance?</span>
          <p>
            Get clear, concise answers to what matters most. Ask and we'll
            respond right here.
          </p>
        </div>

        {/* Форма */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (showAskButton) {
              // Открываем форму вопроса
              console.log("Open question modal");
            } else {
              // Открываем покупку
              console.log("Open premium purchase");
            }
          }}
          className={styles.form}
        >
          <input
            type="text"
            placeholder="Your Question"
            disabled={!showAskButton}
            className={styles.input}
          />
          <button
            type="submit"
            className={styles.submitButton}
            onClick={
              showAskButton ? () => setShowModal(true) : () => alert("pidor")
            }
          >
            <img src={showAskButton ? "" : wallet} />
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
