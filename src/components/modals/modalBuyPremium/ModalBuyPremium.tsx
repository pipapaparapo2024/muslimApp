import React from "react";
import styles from "./ModalBuyPremium.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackButtonClick } from "../../../api/analytics";
import { useTonPay } from "../../../hooks/useTonPay";
import { usePrices } from "../../../hooks/usePrices";
import { useStarsPay } from "../../../hooks/useStarsPay";

interface BuyPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: string;
  onSelectRequests: (count: string) => void;
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const BuyPremiumModal: React.FC<BuyPremiumModalProps> = ({
  isOpen,
  onClose,
  selectedRequests,
  onSelectRequests,
}) => {
  const { t } = useTranslation();
  const { getProductsByType, loading: pricesLoading } = usePrices();

  const { payWithTon, isConnected } = useTonPay();
  const { payWithStars } = useStarsPay();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [, setPaymentMethod] = React.useState<"ton" | "stars" | null>(null);

  // Получаем все премиум продукты из API
  const premiumProducts = getProductsByType("premium");

  // Формируем опции на основе данных из API
  const getPremiumOptions = () => {
    return premiumProducts
      .map((product) => {
        const days = product.revardAmount;
        let label = "";

        if (days === 7) label = `1 ${t("week")}`;
        else if (days === 30) label = `1 ${t("month")}`;
        else if (days === 365) label = `1 ${t("year")}`;
        else label = `${days} ${t("days")}`;

        return {
          label,
          days,
          product,
        };
      })
      .sort((a, b) => a.days - b.days); // Сортируем по возрастанию дней
  };

  const premiumOptions = getPremiumOptions();

  // Получаем цены для выбранной опции
  const getPrices = (optionLabel: string) => {
    const option = premiumOptions.find((opt) => opt.label === optionLabel);

    if (!option) {
      // Fallback если опция не найдена
      return {
        ton: 1,
        stars: 1,
        duration: optionLabel,
        productId: null,
        days: 7,
      };
    }

    const tonPrice =
      option.product.currency.find((curr) => curr.priceType === "TON")
        ?.priceAmount || 1;
    const starsPrice =
      option.product.currency.find((curr) => curr.priceType === "XTR")
        ?.priceAmount || 1;

    return {
      ton: tonPrice,
      stars: starsPrice,
      duration: optionLabel,
      productId: option.product.id,
      days: option.days,
    };
  };

  React.useEffect(() => {
    if (isOpen && premiumOptions.length > 0 && !selectedRequests) {
      // Автоматически выбираем первую опцию если ничего не выбрано
      onSelectRequests(premiumOptions[0].label);
    }
  }, [isOpen, premiumOptions, selectedRequests, onSelectRequests]);

  React.useEffect(() => {
    if (isOpen) {
      trackButtonClick("premium_modal_open", {
        default_selection: selectedRequests,
        is_wallet_connected: isConnected,
        available_products_count: premiumProducts.length,
      });
    }
  }, [isOpen, selectedRequests, isConnected, premiumProducts.length]);

  if (!isOpen) return null;

  const prices = selectedRequests
    ? getPrices(selectedRequests)
    : { ton: 0, stars: 0, duration: "", productId: null, days: 0 };
  const formattedStars = formatNumber(prices.stars);

  const handleClose = () => {
    trackButtonClick("premium_modal_close", {
      final_selection: selectedRequests,
    });
    onClose();
  };

  const handleOptionSelect = (option: string) => {
    const newPrices = getPrices(option);
    trackButtonClick("premium_period_change", {
      from_period: selectedRequests,
      to_period: option,
      ton_price: newPrices.ton,
      stars_price: newPrices.stars,
      product_id: newPrices.productId,
      days: newPrices.days,
    });
    onSelectRequests(option);
  };
  const handleTonPurchase = async () => {
    console.log("TOOOOOOOOOOOOOOOOOOOOOOOOOON");
    if (isProcessing || !prices.productId) return;
    setIsProcessing(true);
    setPaymentMethod("ton");

    try {
      const result = await payWithTon({
        amount: prices.ton,
        type: "premium",
        duration: prices.duration,
        productId: prices.productId,
      });

      // Обработка результата TON оплаты
      switch (result.status) {
        case "success":
          trackButtonClick("premium_purchase_success", {
            payment_method: "ton",
            period: selectedRequests,
            price: prices.ton,
            product_id: prices.productId,
            days: prices.days,
          });
          alert(t("paymentSuccess"));
          onClose();
          break;

        case "rejected":
          trackButtonClick("premium_purchase_rejected", {
            payment_method: "ton",
            period: selectedRequests,
            product_id: prices.productId,
          });
          alert(t("paymentRejected"));
          break;

        case "not_connected":
          trackButtonClick("wallet_connection_opened", {
            context: "premium_purchase",
          });
          break;

        default:
          trackButtonClick("premium_purchase_error", {
            payment_method: "ton",
            error: result.status,
            product_id: prices.productId,
          });
          alert(t("paymentError"));
      }
    } catch (error: any) {
      console.error("TON payment error:", error);
      trackButtonClick("premium_purchase_exception", {
        payment_method: "ton",
        error: error.message,
        product_id: prices.productId,
      });
      alert(t("paymentError"));
    } finally {
      setIsProcessing(false);
      setPaymentMethod(null);
    }
  };

  const handleStarsPurchase = async () => {
    console.log("STAAAAAAAR")
    if (isProcessing || !prices.productId) return;

    setIsProcessing(true);
    setPaymentMethod("stars");

    try {
      const result = await payWithStars({
        amount: prices.stars,
        type: "premium",
        duration: prices.duration,
        productId: prices.productId,
      });

      // Обработка результата Stars оплаты
      switch (result.status) {
        case "success":
          trackButtonClick("premium_purchase_success", {
            payment_method: "stars",
            period: selectedRequests,
            price: prices.stars,
            product_id: prices.productId,
            days: prices.days,
          });
          // Не закрываем модалку сразу, так как пользователь будет перенаправлен на страницу оплаты
          break;

        case "insufficient_funds":
          trackButtonClick("premium_purchase_insufficient_funds", {
            payment_method: "stars",
            period: selectedRequests,
            product_id: prices.productId,
          });
          alert(t("insufficientStars"));
          break;

        default:
          trackButtonClick("premium_purchase_error", {
            payment_method: "stars",
            error: result.error,
            product_id: prices.productId,
          });
          alert(t("paymentError"));
      }
    } catch (error: any) {
      console.error("Stars payment error:", error);
      trackButtonClick("premium_purchase_exception", {
        payment_method: "stars",
        error: error.message,
        product_id: prices.productId,
      });
      alert(t("paymentError"));
    } finally {
      setIsProcessing(false);
      setPaymentMethod(null);
    }
  };

  if (pricesLoading) {
    return (
      <div className={styles.modalOverlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Loading prices...</div>
        </div>
      </div>
    );
  }

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
          {premiumOptions.map((option) => (
            <div
              key={option.label}
              className={`${styles.option} ${
                selectedRequests === option.label ? styles.selected : ""
              }`}
              onClick={() => handleOptionSelect(option.label)}
            >
              <div>{option.label}</div>
              {selectedRequests === option.label && <Check size={20} />}
            </div>
          ))}
        </div>

        <div className={styles.priceBlocks}>
          <div
            className={`${styles.priceBlock} ${styles.tonBlock} ${
              isProcessing ? styles.processing : ""
            }`}
            onClick={handleTonPurchase}
          >
            <div className={styles.priceText}>
              <img src={ton} alt="TON" width="24" height="24" />
              <div className={styles.priceValueTon}>
                {isProcessing ? t("processing") : prices.ton.toFixed(2)}
              </div>
            </div>
            {!isConnected && !isProcessing && (
              <div className={styles.connectHint}>
                {t("connectWalletToPay")}
              </div>
            )}
          </div>

          <div
            className={`${styles.priceBlock} ${styles.starsBlock} ${
              isProcessing ? styles.processing : ""
            }`}
            onClick={handleStarsPurchase}
          >
            <div className={styles.priceText}>
              <img src={star} alt="Stars" width="24" height="24" />
              <div className={`${styles.priceValueStar} ${styles.formatted}`}>
                {/* {formattedStars} */}
                {isProcessing ? t("processing") : formattedStars}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
