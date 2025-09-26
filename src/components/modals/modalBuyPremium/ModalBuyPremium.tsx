import React from "react";
import styles from "./ModalBuyPremium.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { t } from "i18next";
import { trackButtonClick } from "../../../api/analytics";

interface BuyPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: string;
  onSelectRequests: (count: string) => void;
}

// Функция для форматирования чисел с пробелами
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

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

  // 📊 Аналитика: Открытие модального окна премиума
  React.useEffect(() => {
    if (isOpen) {
      trackButtonClick('premium_modal_open', {
        default_selection: selectedRequests
      });
    }
  }, [isOpen, selectedRequests]);

  if (!isOpen) return null;
  const prices = getPrices(selectedRequests);
  const formattedStars = formatNumber(prices.stars);

  const handleClose = () => {
    // 📊 Аналитика: Закрытие модального окна
    trackButtonClick('premium_modal_close', {
      final_selection: selectedRequests
    });
    onClose();
  };

  const handleOptionSelect = (option: string) => {
    // 📊 Аналитика: Изменение выбора периода
    trackButtonClick('premium_period_change', {
      from_period: selectedRequests,
      to_period: option,
      ton_price: getPrices(option).ton,
      stars_price: getPrices(option).stars
    });
    onSelectRequests(option);
  };

  const handleTonPurchase = () => {
    // 📊 Аналитика: Попытка покупки через TON
    trackButtonClick('premium_purchase_attempt', {
      payment_method: 'ton',
      period: selectedRequests,
      price: prices.ton
    });
    console.log("buy with ton");
    // Здесь будет логика покупки
  };

  const handleStarsPurchase = () => {
    // 📊 Аналитика: Попытка покупки через Stars
    trackButtonClick('premium_purchase_attempt', {
      payment_method: 'stars',
      period: selectedRequests,
      price: prices.stars
    });
    console.log("buy with stars");
    // Здесь будет логика покупки
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t("goPremium")}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>{t("premiumDescription")}</p>

        <div className={styles.options}>
          {[`1 ${t("week")}`, `1 ${t("month")}`, `1 ${t("year")}`].map(
            (option) => (
              <div
                key={option}
                className={`${styles.option} ${
                  selectedRequests === option ? styles.selected : ""
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                <div>{t(option.replace(" ", ""))}</div>
                {selectedRequests === option && <Check size={20} />}
              </div>
            )
          )}
        </div>

        <div className={styles.priceBlocks}>
          <div
            className={`${styles.priceBlock} ${styles.tonBlock}`}
            onClick={handleTonPurchase}
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
            onClick={handleStarsPurchase}
          >
            <div className={styles.priceText}>
              <img src={star} alt="Stars" width="24" height="24" />
              <div className={`${styles.priceValueStar} ${styles.formatted}`}>
                {formattedStars}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};