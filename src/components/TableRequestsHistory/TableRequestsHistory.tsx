import { Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./TableRequestsHistory.module.css";
import { useQnAStore } from "../../hooks/useQnAStore";
import { t } from "i18next";
import { BuyRequestsModal } from "../modals/modalBuyReqeuests/ModalBuyRequests";
import { useState } from "react";

interface ClickHistory {
  text: string;
}

export const TableRequestsHistory: React.FC<ClickHistory> = ({ text }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { requestsLeft, hasPremium, isLoading } = useQnAStore();
  const navigate = useNavigate();
  const getStatusText = () => {
    if (isLoading) return t("loading");
    if (hasPremium) return t("haveRequests");
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
      <button className={styles.button} onClick={()=>setShowModal(true)}>
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
