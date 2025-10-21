import { Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./TableRequestsHistory.module.css";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { BuyRequestsModal } from "../modals/modalBuyReqeuests/ModalBuyRequests";
import { useEffect, useState } from "react";
import { useTranslationsStore } from "../../hooks/useTranslations";
import { trackButtonClick } from "../../api/analytics";
interface ClickHistory {
  text: string;
}

export const TableRequestsHistory: React.FC<ClickHistory> = ({ text }) => {
  const { translations } = useTranslationsStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const {
    requestsLeft,
    hasPremium,
    isLoading,
    premiumDaysLeft,
    fetchUserData,
  } = usePremiumStore();
  const navigate = useNavigate();

  const getStatusText = () => {
    if (isLoading) return translations?.loading;
    if (hasPremium) {
      if (premiumDaysLeft ? premiumDaysLeft > 0)
        return `${premiumDaysLeft} ${translations?.daysLeft}`;
      else if (premiumDaysLeft == 0)
        return `${translations?.lastDay}`
    }
    if (requestsLeft != null && requestsLeft > 0)
      return `${requestsLeft} ${translations?.requests}`;
    return translations?.noRequests;
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleHistoryClick = () => {
    navigate(text);
  };

  const handleBuyRequestsClick = () => {
    setShowModal(true);
  };

  return (
    <div className={styles.header}>
      <button
        className={styles.button}
        onClick={() => {
          handleHistoryClick();
          if ((text = "/qna/history")) {
            trackButtonClick("qa", "history_button");
          } else {
            trackButtonClick("food_scan", "history_button");
          }
        }}
      >
        <Clock size={20} strokeWidth={1.5} />
        <span>{translations?.history}</span>
      </button>
      <button className={styles.button} onClick={handleBuyRequestsClick}>
        <MessageCircle size={20} strokeWidth={1.5} />
        {getStatusText()}
      </button>
      <BuyRequestsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedRequests={selectedRequests}
        onSelectRequests={setSelectedRequests}
      />
    </div>
  );
};
