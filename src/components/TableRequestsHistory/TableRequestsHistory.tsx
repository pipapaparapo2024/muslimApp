import { Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./TableRequestsHistory.module.css";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { t } from "i18next";
import { BuyRequestsModal } from "../modals/modalBuyReqeuests/ModalBuyRequests";
import { useState } from "react";

interface ClickHistory {
  text: string;
}

export const TableRequestsHistory: React.FC<ClickHistory> = ({ text }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { requestsLeft, hasPremium, isLoading, premiumDaysLeft } =
    usePremiumStore();
  const navigate = useNavigate();
  const getStatusText = () => {
    console.log("hasPremiumrrrrrrrrrrr", hasPremium);
    console.log("requestsLeftrrrrrrr", requestsLeft);
    console.log("premiumDaysLeftrrrrrrrrr", premiumDaysLeft);
    if (isLoading) return t("loading");
    if (hasPremium) return {premiumDaysLeft} + t("haveRequests");
    if (requestsLeft != null && requestsLeft > 0)
      return `${requestsLeft} ${t("requests")}`;
    return t("noRequests");
  };
  return (
    <div className={styles.header}>
      <button className={styles.button} onClick={() => navigate(text)}>
        <Clock size={20} strokeWidth={1.5} />
        <span>{t("history")}</span>
      </button>
      <button className={styles.button} onClick={() => setShowModal(true)}>
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
