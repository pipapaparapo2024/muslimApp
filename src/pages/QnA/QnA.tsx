import React, { useEffect, useState } from "react";
import styles from "./QnA.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import thinkPerson from "../../assets/image/get.png";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackButtonClick } from "../../api/analytics";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react"; // Добавляем импорт

export const QnA: React.FC = () => {
  const { requestsLeft, hasPremium } = usePremiumStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [, setImageError] = useState(false);
  const [question, setQuestion] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Добавляем проверку подключения кошелька
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

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
      return t("askQuestion");
    }
    return t("buyRequests");
  };

  const showAskButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    trackButtonClick("submit_question", {
      question_length: question.trim().length,
      has_premium: hasPremium,
      requests_left: requestsLeft,
    });

    navigate("/qna/analyzing", {
      state: {
        question: question.trim(),
      },
    });
  };

  const handleBuyRequestsClick = async () => {
    trackButtonClick("buy_requests_from_qna", {
      has_premium: hasPremium,
      requests_left: requestsLeft,
      wallet_connected: !!userAddress
    });

    if (!userAddress) {
      trackButtonClick('wallet_connection_triggered', {
        context: 'buy_requests_qna'
      });
      await tonConnectUI.openModal();
      return; 
    }

    setShowModal(true);
  };

  if (!imageLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        <TableRequestsHistory text="/qna/history" />

        {/* Центральный контент */}
        <div className={styles.content}>
          <div className={styles.illustration}>
            <img
              src={thinkPerson}
              alt="Ask a question"
              onError={() => setImageError(true)}
            />
          </div>

          <div className={styles.guidance}>
            <span>{t("needGuidance")}</span>
            <p>{t("getClearAnswers")}</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (showAskButton && question.trim()) {
              handleSubmit();
            } else if (!showAskButton) {
              handleBuyRequestsClick();
            }
          }}
          className={styles.form}
        >
          <input
            type="text"
            placeholder={t("yourQuestion")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!showAskButton}
            className={styles.input}
          />
          <button
            type="submit"
            className={styles.submitButton}
            disabled={showAskButton && !question.trim()}
            onClick={!showAskButton ? handleBuyRequestsClick : undefined}
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