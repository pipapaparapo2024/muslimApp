import React from "react";
import styles from "./ModalBuyRequests.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";

interface BuyPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: string;
  onSelectRequests: (count: string) => void;
}

const getPrices = (requests: string) => {
  switch (requests) {
    case "10 Requests":
      return { ton: 3.45, stars: 2250 };
    case "100 Requests":
      return { ton: 34.5, stars: 22500 };
    case "1000 Requests":
      return { ton: 345, stars: 225000 };
    default:
      return { ton: 0, stars: 0 };
  }
};

export const BuyRequestsModal: React.FC<BuyPremiumModalProps> = ({
  isOpen,
  onClose,
  selectedRequests,
  onSelectRequests,
}) => {
  if (!isOpen) return null;
  const prices = getPrices(selectedRequests);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Buy Requests</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>
          Requests are used to access key features in the app. Purchase a pack
          to continue using the tools without interruption.
        </p>

        <div className={styles.options}>
          {["10 Requests", "100 Requests", "1000 Requests"].map((option) => (
            <div
              key={option}
              className={`${styles.option} ${
                selectedRequests === option ? styles.selected : ""
              }`}
              onClick={() => onSelectRequests(option)}
            >
              <div>{option}</div>
              {selectedRequests === option && (
                  <Check size={20} />
              )}
            </div>
          ))}
        </div>

        <div className={styles.priceBlocks}>
          <div className={`${styles.priceBlock} ${styles.tonBlock}`}>
            <div
              className={styles.priceText}
              onClick={() => console.log("buy")}
            >
              <img src={ton} alt="TON" width="24" height="24" />
              <div
                className={styles.priceValueTon}
                onClick={() => console.log("buy")}
              >
                {prices.ton.toFixed(2)}
              </div>
            </div>
          </div>

          <div
            className={`${styles.priceBlock} ${styles.starsBlock}`}
            onClick={() => console.log("buy bitch")}
          >
            <div className={styles.priceText}>
              <img src={star} alt="Stars" width="24" height="24" />
              <div className={styles.priceValueStar}>{prices.stars}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
