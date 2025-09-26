import { Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./TableRequestsHistory.module.css";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { t } from "i18next";
import { BuyRequestsModal } from "../modals/modalBuyReqeuests/ModalBuyRequests";
import { useEffect, useState } from "react";
import { trackButtonClick } from "../../api/analytics";
interface ClickHistory {
  text: string;
}

export const TableRequestsHistory: React.FC<ClickHistory> = ({ text }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { requestsLeft, hasPremium, isLoading, premiumDaysLeft, fetchUserData } =
    usePremiumStore();
  const navigate = useNavigate();

  const getStatusText = () => {
    if (isLoading) return t("loading");
    if (hasPremium) return `${premiumDaysLeft} ${t("daysLeft")}`;
    if (requestsLeft != null && requestsLeft > 0)
      return `${requestsLeft} ${t("requests")}`;
    return t("noRequests");
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleHistoryClick = () => {
    trackButtonClick("history_button", { destination: text });
    navigate(text);
  };

  const handleBuyRequestsClick = () => {
    trackButtonClick("buy_requests_button", {
      current_requests_left: requestsLeft,
      has_premium: hasPremium,
    });
    setShowModal(true);
  };

  return (
    <div className={styles.header}>
      <button className={styles.button} onClick={handleHistoryClick}>
        <Clock size={20} strokeWidth={1.5} />
        <span>{t("history")}</span>
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