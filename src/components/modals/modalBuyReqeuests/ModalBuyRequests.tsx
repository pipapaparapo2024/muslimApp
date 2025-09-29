import React from "react";
import styles from "./ModalBuyRequests.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackButtonClick } from "../../../api/analytics";
import { useTonPay } from "../../../hooks/useTonPay";
import { usePrices } from "../../../hooks/usePrices";

interface BuyRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: string;
  onSelectRequests: (count: string) => void;
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const BuyRequestsModal: React.FC<BuyRequestsModalProps> = ({
  isOpen,
  onClose,
  selectedRequests,
  onSelectRequests,
}) => {
  const { t } = useTranslation();
  const { pay, isConnected } = useTonPay();
  const { getPrice, loading: pricesLoading } = usePrices();
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Получаем цены для запросов
  const getPrices = (requests: string) => {
    const tonPrice = getPrice('requests', 'TON');
    const starsPrice = getPrice('requests', 'STARS');
    
    // Базовые цены на случай если API не вернул данные
    const basePrices = {
      '10': { ton: 3.45, stars: 2250 },
      '100': { ton: 34.5, stars: 22500 },
      '1000': { ton: 345, stars: 225000 }
    };

    switch (requests) {
      case `10 ${t("requests")}`:
        return { 
          ton: tonPrice || basePrices['10'].ton, 
          stars: starsPrice || basePrices['10'].stars, 
          quantity: 10 
        };
      case `100 ${t("requests")}`:
        return { 
          ton: tonPrice || basePrices['100'].ton, 
          stars: starsPrice || basePrices['100'].stars, 
          quantity: 100 
        };
      case `1000 ${t("requests")}`:
        return { 
          ton: tonPrice || basePrices['1000'].ton, 
          stars: starsPrice || basePrices['1000'].stars, 
          quantity: 1000 
        };
      default:
        return { ton: 0, stars: 0, quantity: 0 };
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      trackButtonClick('requests_modal_open', {
        default_selection: selectedRequests,
        is_wallet_connected: isConnected
      });
    }
  }, [isOpen, selectedRequests, isConnected]);

  if (!isOpen) return null;
  
  const prices = getPrices(selectedRequests);
  const formattedStars = formatNumber(prices.stars);

  const handleClose = () => {
    trackButtonClick('requests_modal_close', {
      final_selection: selectedRequests
    });
    onClose();
  };

  const handleOptionSelect = (option: string) => {
    trackButtonClick('requests_count_change', {
      from_count: selectedRequests,
      to_count: option,
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
        type: 'requests',
        quantity: prices.quantity,
      });

      // Обработка результата оплаты
      switch (result.status) {
        case 'success':
          trackButtonClick('requests_purchase_success', {
            payment_method: 'ton',
            requests_count: selectedRequests,
            price: prices.ton,
            quantity: prices.quantity
          });
          alert(t('paymentSuccess'));
          onClose();
          break;
          
        case 'rejected':
          trackButtonClick('requests_purchase_rejected', {
            payment_method: 'ton',
            requests_count: selectedRequests
          });
          alert(t('paymentRejected'));
          break;
          
        case 'not_connected':
          trackButtonClick('wallet_connection_opened', {
            context: 'requests_purchase'
          });
          break;
          
        default:
          trackButtonClick('requests_purchase_error', {
            payment_method: 'ton',
            error: result.status
          });
          alert(t('paymentError'));
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      trackButtonClick('requests_purchase_exception', {
        payment_method: 'ton',
        error: error.message
      });
      alert(t('paymentError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStarsPurchase = () => {
    trackButtonClick('requests_purchase_attempt', {
      payment_method: 'stars', 
      requests_count: selectedRequests,
      price: prices.stars,
      quantity: prices.quantity
    });
    console.log("Buying", prices.quantity, "requests with stars for", prices.stars, "stars");
    // Логика для оплаты звездами
  };

  if (pricesLoading) {
    return (
      <div className={styles.modalOverlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>{t("loadingPrices")}</p>
          </div>
        </div>
      </div>
    );
  }

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
              <div className={styles.optionText}>
                {option.replace("requestsPrem", "").trim()}
                <span className={styles.requestsLabel}>{t("requests")}</span>
              </div>
              {selectedRequests === option && (
                <div className={styles.selectedIndicator}>
                  <Check size={20} />
                </div>
              )}
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
            <div className={styles.priceContent}>
              <div className={styles.priceText}>
                <img src={ton} alt="TON" className={styles.currencyIcon} />
                <div className={styles.priceValueTon}>
                  {isProcessing ? t('processing') : `${prices.ton.toFixed(2)} TON`}
                </div>
              </div>
              {!isConnected && !isProcessing && (
                <div className={styles.connectHint}>
                  {t('connectWalletToPay')}
                </div>
              )}
            </div>
          </div>

          <div
            className={`${styles.priceBlock} ${styles.starsBlock}`}
            onClick={handleStarsPurchase}
          >
            <div className={styles.priceContent}>
              <div className={styles.priceText}>
                <img src={star} alt="Stars" className={styles.currencyIcon} />
                <div className={styles.priceValueStar}>
                  {formattedStars} {t('stars')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};