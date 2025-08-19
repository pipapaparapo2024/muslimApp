import React, { useEffect, useState } from "react";
import styles from "./Scanner.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { useQnAStore } from "../QnA/QnAStore";
import {
  Camera,
  Clock,
  MessageCircle,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { useNavigate } from "react-router-dom";
import scanner from "../../assets/image/scanner.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";

export const Scanner: React.FC = () => {
  const { requestsLeft, hasPremium, isLoading, fetchUserData } = useQnAStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState(10);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Предзагрузка изображения scanner
  useEffect(() => {
    const img = new Image();
    img.src = scanner;

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load scanner image:", scanner);
      setImageError(true);
      setImageLoaded(true); // Чтобы не зависать в лоадинге
    };
  }, []);

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

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        {/* Фиксированная шапка */}
        <div className={styles.header}>
          <button
            className={styles.button}
            onClick={() => navigate("/quran/historySkanner")}
          >
            <Clock size={20} strokeWidth={1.5} />
            <span>History</span>
          </button>
          <button className={styles.button}>
            <MessageCircle size={20} strokeWidth={1.5} />
            {getStatusText()}
          </button>
        </div>

        {/* Центральный контент */}
        <div className={styles.content}>
          <div className={styles.illustration}>
            <img src={scanner} alt="Instant Halal Check" />
          </div>

          <div className={styles.halalCheck}>
            <span>Instant Halal Check</span>
            <p>
              Take a photo of the product’s ingredients to check if it’s halal
              or haram. You’ll get a quick result with a short explanation.
            </p>
            <p className={styles.warning}>
              <TriangleAlert strokeWidth={1.5} size={18} />
              The result is for informational purposes only.
            </p>
          </div>
        </div>

        {/* Фиксированная форма внизу */}
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
            onClick={() => setShowModal(true)}
          >
            {showAskButton ? (
              <Camera strokeWidth={1.5} />
            ) : (
              <Wallet strokeWidth={1.5} />
            )}
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
