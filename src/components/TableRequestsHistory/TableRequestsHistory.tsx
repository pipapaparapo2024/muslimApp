import { Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./TableRequestsHistory.module.css";
import { useQnAStore } from "../../hooks/useQnAStore";

interface ClickHistory{
  text:string;
}

export const TableRequestsHistory: React.FC<ClickHistory> = ({text}) => {
  const { requestsLeft, hasPremium, isLoading } = useQnAStore();
  const navigate = useNavigate();
  const getStatusText = () => {
    if (isLoading) return "Loading...";
    if (hasPremium) return "Have Requests";
    if (requestsLeft != null && requestsLeft > 0)
      return `${requestsLeft} Requests`;
    return "No Requests";
  };
  return (
    <div className={styles.header}>
      <button
        className={styles.button}
        onClick={() => navigate(text)}
      >
        <Clock size={20} strokeWidth={1.5} />
        <span>History</span>
      </button>
      <button className={styles.button}>
        <MessageCircle size={20} strokeWidth={1.5} />
        {getStatusText()}
      </button>
    </div>
  );
};
