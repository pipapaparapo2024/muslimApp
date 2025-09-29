import React from "react";
import styles from "./ModalBuyPremium.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackButtonClick } from "../../../api/analytics";
import { useTonPay } from "../../../hooks/useTonPay";
import { usePrices } from "../../../hooks/usePrices";

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
  const { pay, isConnected } = useTonPay();
  const { getProductsByType, loading: pricesLoading } = usePrices();
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Получаем все премиум продукты из API
  const premiumProducts = getProductsByType('premium');

  // Формируем опции на основе данных из API
  const getPremiumOptions = () => {
    return premiumProducts.map(product => {
      const days = product.revardAmount;
      let label = '';
      
      if (days === 7) label = `1 ${t("week")}`;
      else if (days === 30) label = `1 ${t("month")}`;
      else if (days === 365) label = `1 ${t("year")}`;
      else label = `${days} ${t("days")}`;
      
      return {
        label,
        days,
        product
      };
    }).sort((a, b) => a.days - b.days); // Сортируем по возрастанию дней
  };

  const premiumOptions = getPremiumOptions();

  // Получаем цены для выбранной опции
  const getPrices = (optionLabel: string) => {
    const option = premiumOptions.find(opt => opt.label === optionLabel);
    
    if (!option) {
      // Fallback если опция не найдена
      return { 
        ton: 1, 
        stars: 1,
        duration: optionLabel,
        productId: null,
        days: 7
      };
    }

    const tonPrice = option.product.currency.find(curr => curr.priceType === 'TON')?.priceAmount || 1;
    const starsPrice = option.product.currency.find(curr => curr.priceType === 'XTR')?.priceAmount || 1;

    return {
      ton: tonPrice,
      stars: starsPrice,
      duration: optionLabel,
      productId: option.product.id,
      days: option.days
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
      trackButtonClick('premium_modal_open', {
        default_selection: selectedRequests,
        is_wallet_connected: isConnected,
        available_products_count: premiumProducts.length
      });
    }
  }, [isOpen, selectedRequests, isConnected, premiumProducts.length]);

  if (!isOpen) return null;
  
  const prices = selectedRequests ? getPrices(selectedRequests) : { ton: 0, stars: 0, duration: '', productId: null, days: 0 };
  const formattedStars = formatNumber(prices.stars);

  const handleClose = () => {
    trackButtonClick('premium_modal_close', {
      final_selection: selectedRequests
    });
    onClose();
  };

  const handleOptionSelect = (option: string) => {
    const newPrices = getPrices(option);
    trackButtonClick('premium_period_change', {
      from_period: selectedRequests,
      to_period: option,
      ton_price: newPrices.ton,
      stars_price: newPrices.stars,
      product_id: newPrices.productId,
      days: newPrices.days
    });
    onSelectRequests(option);
  };

  const handleTonPurchase = async () => {
    if (isProcessing || !prices.productId) return;
    
    setIsProcessing(true);
    
    try {
      const result = await pay({
        amount: prices.ton,
        type: 'premium',
        duration: prices.duration,
        // productId: prices.productId
      });

      // Обработка результата
      switch (result.status) {
        case 'success':
          trackButtonClick('premium_purchase_success', {
            payment_method: 'ton',
            period: selectedRequests,
            price: prices.ton,
            product_id: prices.productId,
            days: prices.days
          });
          alert(t('paymentSuccess'));
          onClose();
          break;
          
        case 'rejected':
          trackButtonClick('premium_purchase_rejected', {
            payment_method: 'ton',
            period: selectedRequests,
            product_id: prices.productId
          });
          alert(t('paymentRejected'));
          break;
          
        case 'not_connected':
          trackButtonClick('wallet_connection_opened', {
            context: 'premium_purchase'
          });
          break;
          
        default:
          trackButtonClick('premium_purchase_error', {
            payment_method: 'ton',
            error: result.status,
            product_id: prices.productId
          });
          alert(t('paymentError'));
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      trackButtonClick('premium_purchase_exception', {
        payment_method: 'ton',
        error: error.message,
        product_id: prices.productId
      });
      alert(t('paymentError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStarsPurchase = () => {
    if (!prices.productId) return;
    
    trackButtonClick('premium_purchase_attempt', {
      payment_method: 'stars',
      period: selectedRequests,
      price: prices.stars,
      product_id: prices.productId,
      days: prices.days
    });
    console.log("buy with stars", {
      productId: prices.productId,
      amount: prices.stars,
      period: selectedRequests,
      days: prices.days
    });
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
              isProcessing ? styles.processing : ''
            }`}
            onClick={handleTonPurchase}
          >
            <div className={styles.priceText}>
              <img src={ton} alt="TON" width="24" height="24" />
              <div className={styles.priceValueTon}>
                {isProcessing ? t('processing') : prices.ton.toFixed(2)}
              </div>
            </div>
            {!isConnected && !isProcessing && (
              <div className={styles.connectHint}>
                {t('connectWalletToPay')}
              </div>
            )}
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