import React from "react";
import styles from "./ModalBuyRequests.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { t } from "i18next";
import { trackButtonClick } from "../../../api/global";

interface BuyRequestsModalProps {
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
    case `10 ${t("requestsPrem")}`:
      return { ton: 3.45, stars: 2250 };
    case `100 ${t("requestsPrem")}`:
      return { ton: 34.5, stars: 22500 };
    case `1000 ${t("requestsPrem")}`:
      return { ton: 345, stars: 225000 };
    default:
      return { ton: 0, stars: 0 };
  }
};

export const BuyRequestsModal: React.FC<BuyRequestsModalProps> = ({
  isOpen,
  onClose,
  selectedRequests,
  onSelectRequests,
}) => {
  const { t } = useTranslation();

  // 📊 Аналитика: Открытие модального окна запросов
  React.useEffect(() => {
    if (isOpen) {
      trackButtonClick('requests_modal_open', {
        default_selection: selectedRequests
      });
    }
  }, [isOpen, selectedRequests]);

  if (!isOpen) return null;
  const prices = getPrices(selectedRequests);
  const formattedStars = formatNumber(prices.stars);

  const handleClose = () => {
    // 📊 Аналитика: Закрытие модального окна
    trackButtonClick('requests_modal_close', {
      final_selection: selectedRequests
    });
    onClose();
  };

  const handleOptionSelect = (option: string) => {
    // 📊 Аналитика: Изменение выбора количества запросов
    trackButtonClick('requests_count_change', {
      from_count: selectedRequests,
      to_count: option,
      ton_price: getPrices(option).ton,
      stars_price: getPrices(option).stars
    });
    onSelectRequests(option);
  };

  const handleTonPurchase = () => {
    // 📊 Аналитика: Попытка покупки запросов через TON
    trackButtonClick('requests_purchase_attempt', {
      payment_method: 'ton',
      requests_count: selectedRequests,
      price: prices.ton
    });
    console.log("buy with ton");
    // Здесь будет логика покупки
  };

  const handleStarsPurchase = () => {
    // 📊 Аналитика: Попытка покупки запросов через Stars
    trackButtonClick('requests_purchase_attempt', {
      payment_method: 'stars', 
      requests_count: selectedRequests,
      price: prices.stars
    });
    console.log("buy with stars");
    // Здесь будет логика покупки
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t("buyRequests")}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>{t("requestsDescription")}</p>

        <div className={styles.options}>
          {[
            `10 ${t("requestsPrem")}`,
            `100 ${t("requestsPrem")}`,
            `1000 ${t("requestsPrem")}`,
          ].map((option) => (
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
          ))}
        </div>

        <div className={styles.priceBlocks}>
          <div className={`${styles.priceBlock} ${styles.tonBlock}`}>
            <div
              className={styles.priceText}
              onClick={handleTonPurchase}
            >
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