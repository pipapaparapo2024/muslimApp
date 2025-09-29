import React from "react";
import styles from "./ModalBuyRequests.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { t } from "i18next";
import { trackButtonClick } from "../../../api/analytics";
import { useTonPay } from "../../../hooks/useTonPay";

interface BuyRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: string;
  onSelectRequests: (count: string) => void;
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const getPrices = (requests: string) => {
  switch (requests) {
    case `10 ${t("requestsPrem")}`:
      return { ton: 3.45, stars: 2250, quantity: 10 };
    case `100 ${t("requestsPrem")}`:
      return { ton: 34.5, stars: 22500, quantity: 100 };
    case `1000 ${t("requestsPrem")}`:
      return { ton: 345, stars: 225000, quantity: 1000 };
    default:
      return { ton: 0, stars: 0, quantity: 0 };
  }
};

export const BuyRequestsModal: React.FC<BuyRequestsModalProps> = ({
  isOpen,
  onClose,
  selectedRequests,
  onSelectRequests,
}) => {
  const { t } = useTranslation();
  const { pay, isConnected } = useTonPay();
  const [isProcessing, setIsProcessing] = React.useState(false);

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
            price: prices.ton
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
          // Модальное окно уже открыто автоматически в useTonPay
          trackButtonClick('wallet_connection_opened', {
            context: 'requests_purchase'
          });
          // Не закрываем модалку - пусть пользователь подключит кошелек
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
      price: prices.stars
    });
    console.log("buy with stars");
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