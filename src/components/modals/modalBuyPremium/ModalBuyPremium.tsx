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

  // Сопоставляем опции с данными из API
  const getProductForOption = (option: string) => {
    const durationMap: { [key: string]: number } = {
      [`1 ${t("week")}`]: 7,
      [`1 ${t("month")}`]: 30,
      [`1 ${t("year")}`]: 365
    };

    const targetDuration = durationMap[option];
    return premiumProducts.find(product => product.revardAmount === targetDuration);
  };

  // Получаем цены для выбранной опции
  const getPrices = (option: string) => {
    const product = getProductForOption(option);
    
    if (!product) {
      // Fallback цены если продукт не найден
      const fallbackPrices = {
        [`1 ${t("week")}`]: { ton: 10, stars: 10 },
        [`1 ${t("month")}`]: { ton: 20, stars: 20 },
        [`1 ${t("year")}`]: { ton: 30, stars: 30 }
      };
      return { 
        ton: fallbackPrices[option as keyof typeof fallbackPrices]?.ton || 1, 
        stars: fallbackPrices[option as keyof typeof fallbackPrices]?.stars || 1,
        duration: option,
        productId: null
      };
    }

    const tonPrice = product.currency.find(curr => curr.priceType === 'TON')?.priceAmount || 1;
    const starsPrice = product.currency.find(curr => curr.priceType === 'XTR')?.priceAmount || 1;

    return {
      ton: tonPrice,
      stars: starsPrice,
      duration: option,
      productId: product.id
    };
  };

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
  
  const prices = getPrices(selectedRequests);
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
      product_id: newPrices.productId
    });
    onSelectRequests(option);
  };

  const handleTonPurchase = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const result = await pay({
        amount: prices.ton,
        type: 'premium',
        duration: prices.duration,
        // productId: prices.productId || undefined
      });

      // Обработка результата
      switch (result.status) {
        case 'success':
          trackButtonClick('premium_purchase_success', {
            payment_method: 'ton',
            period: selectedRequests,
            price: prices.ton,
            product_id: prices.productId
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
    trackButtonClick('premium_purchase_attempt', {
      payment_method: 'stars',
      period: selectedRequests,
      price: prices.stars,
      product_id: prices.productId
    });
    console.log("buy with stars", {
      productId: prices.productId,
      amount: prices.stars,
      period: selectedRequests
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
          {[`1 ${t("week")}`, `1 ${t("month")}`, `1 ${t("year")}`].map(
            (option) => {
              const optionPrices = getPrices(option);
              return (
                <div
                  key={option}
                  className={`${styles.option} ${
                    selectedRequests === option ? styles.selected : ""
                  }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className={styles.optionContent}>
                    <div>{t(option.replace(" ", ""))}</div>
                    <div className={styles.optionPrice}>
                      {optionPrices.ton} TON / {formatNumber(optionPrices.stars)} ⭐
                    </div>
                  </div>
                  {selectedRequests === option && <Check size={20} />}
                </div>
              );
            }
          )}
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