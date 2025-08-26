import React from "react";
import styles from "./ModalBuyPremium.module.css";
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
    case "1 Week":
      return { ton: 3.45, stars: 2250 };
    case "1 Month":
      return { ton: 34.5, stars: 22500 };
    case "1 Year":
      return { ton: 345, stars: 225000 };
    default:
      return { ton: 0, stars: 0 };
  }
};

export const BuyPremiumModal: React.FC<BuyPremiumModalProps> = ({
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
          <h2>Go Premium</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>
          Unlock all features with a single upgrade. Enjoy full access without
          limits.
        </p>

        <div className={styles.options}>
          {["1 Week", "1 Month", "1 Year"].map((option) => (
            <div
              key={option}
              className={`${styles.option} ${
                selectedRequests === option ? styles.selected : ""
              }`}
              onClick={() => onSelectRequests(option)}
            >
              <div>{option}</div>
              {selectedRequests === option && <Check size={20} />}
            </div>
          ))}
        </div>

        <div className={styles.priceBlocks}>
          <div
            className={`${styles.priceBlock} ${styles.tonBlock}`}
            onClick={() => console.log("buy bitch")}
          >
            <div className={styles.priceText}>
              <img src={ton} alt="TON" width="24" height="24" />
              <div className={styles.priceValueTon}>
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
