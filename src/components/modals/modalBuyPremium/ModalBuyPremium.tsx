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
  const { getPrice, loading: pricesLoading } = usePrices();
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Получаем цены для премиума
  const getPrices = (duration: string) => {
    const tonPrice = getPrice('premium', 'TON');
    const starsPrice = getPrice('premium', 'XTR');
    
    // Базовые цены на случай если API не вернул данные
    const basePrices = {
      week: { ton: 3.45, stars: 2250 },
      month: { ton: 34.5, stars: 22500 },
      year: { ton: 345, stars: 225000 }
    };

    switch (duration) {
      case `1 ${t("week")}`:
        return { 
          ton: tonPrice || basePrices.week.ton, 
          stars: starsPrice || basePrices.week.stars, 
          duration: 'week' 
        };
      case `1 ${t("month")}`:
        return { 
          ton: tonPrice || basePrices.month.ton, 
          stars: starsPrice || basePrices.month.stars, 
          duration: 'month' 
        };
      case `1 ${t("year")}`:
        return { 
          ton: tonPrice || basePrices.year.ton, 
          stars: starsPrice || basePrices.year.stars, 
          duration: 'year' 
        };
      default:
        return { ton: 0, stars: 0, duration: '' };
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      trackButtonClick('premium_modal_open', {
        default_selection: selectedRequests,
        is_wallet_connected: isConnected
      });
    }
  }, [isOpen, selectedRequests, isConnected]);

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
    trackButtonClick('premium_period_change', {
      from_period: selectedRequests,
      to_period: option,
      ton_price: getPrices(option).ton,
      stars_price: getPrices(option).stars
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
      });

      // Обработка результата
      switch (result.status) {
        case 'success':
          trackButtonClick('premium_purchase_success', {
            payment_method: 'ton',
            period: selectedRequests,
            price: prices.ton
          });
          alert(t('paymentSuccess'));
          onClose();
          break;
          
        case 'rejected':
          trackButtonClick('premium_purchase_rejected', {
            payment_method: 'ton',
            period: selectedRequests
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
            error: result.status
          });
          alert(t('paymentError'));
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      trackButtonClick('premium_purchase_exception', {
        payment_method: 'ton',
        error: error.message
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
      price: prices.stars
    });
    console.log("buy with stars");
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