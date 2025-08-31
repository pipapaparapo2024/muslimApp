import React from "react";
import styles from "./ModalBuyPremium.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { t } from "i18next";

interface BuyPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: string;
  onSelectRequests: (count: string) => void;
}

const getPrices = (requests: string) => {
  switch (requests) {
    case `1 ${t("week")}`:
      return { ton: 3.45, stars: 2250 };
    case `1 ${t("month")}`:
      return { ton: 34.5, stars: 22500 };
    case `1 ${t("year")}`:
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
  const { t } = useTranslation();

  if (!isOpen) return null;
  const prices = getPrices(selectedRequests);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t("goPremium")}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>
          {t("premiumDescription")}
        </p>

        <div className={styles.options}>
          {[`1 ${t("week")}`, `1 ${t("month")}`, `1 ${t("year")}`].map((option) => (
            <div
              key={option}
              className={`${styles.option} ${
                selectedRequests === option ? styles.selected : ""
              }`}
              onClick={() => onSelectRequests(option)}
            >
              <div>{t(option.toLowerCase().replace(" ", ""))}</div>
              {selectedRequests === option && <Check size={20} />}
            </div>
          ))}
        </div>

        <div className={styles.priceBlocks}>
          <div
            className={`${styles.priceBlock} ${styles.tonBlock}`}
            onClick={() => console.log("buy with ton")}
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
            onClick={() => console.log("buy with stars")}
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