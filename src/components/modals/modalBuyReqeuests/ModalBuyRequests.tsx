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
  const { getProductsByType, loading: pricesLoading } = usePrices();
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Получаем все продукты запросов из API
  const requestsProducts = getProductsByType('requests');

  // Формируем опции на основе данных из API
  const getRequestOptions = () => {
    return requestsProducts.map(product => ({
      label: `${product.revardAmount} ${t("requests")}`,
      quantity: product.revardAmount,
      product
    })).sort((a, b) => a.quantity - b.quantity); // Сортируем по возрастанию количества
  };

  const requestOptions = getRequestOptions();

  // Получаем цены для выбранной опции
  const getPrices = (optionLabel: string) => {
    const option = requestOptions.find(opt => opt.label === optionLabel);
    
    if (!option) {
      // Fallback если опция не найдена
      return { 
        ton: 1, 
        stars: 1,
        quantity: parseInt(optionLabel.split(' ')[0]) || 10,
        productId: null
      };
    }

    const tonPrice = option.product.currency.find(curr => curr.priceType === 'TON')?.priceAmount || 1;
    const starsPrice = option.product.currency.find(curr => curr.priceType === 'XTR')?.priceAmount || 1;

    return {
      ton: tonPrice,
      stars: starsPrice,
      quantity: option.quantity,
      productId: option.product.id
    };
  };

  React.useEffect(() => {
    if (isOpen && requestOptions.length > 0 && !selectedRequests) {
      // Автоматически выбираем первую опцию если ничего не выбрано
      onSelectRequests(requestOptions[0].label);
    }
  }, [isOpen, requestOptions, selectedRequests, onSelectRequests]);

  React.useEffect(() => {
    if (isOpen) {
      trackButtonClick('requests_modal_open', {
        default_selection: selectedRequests,
        is_wallet_connected: isConnected,
        available_products_count: requestsProducts.length
      });
    }
  }, [isOpen, selectedRequests, isConnected, requestsProducts.length]);

  if (!isOpen) return null;
  
  const prices = selectedRequests ? getPrices(selectedRequests) : { ton: 0, stars: 0, quantity: 0, productId: null };
  const formattedStars = formatNumber(prices.stars);

  const handleClose = () => {
    trackButtonClick('requests_modal_close', {
      final_selection: selectedRequests
    });
    onClose();
  };

  const handleOptionSelect = (option: string) => {
    const newPrices = getPrices(option);
    trackButtonClick('requests_count_change', {
      from_count: selectedRequests,
      to_count: option,
      ton_price: newPrices.ton,
      stars_price: newPrices.stars,
      product_id: newPrices.productId,
      quantity: newPrices.quantity
    });
    onSelectRequests(option);
  };

  const handleTonPurchase = async () => {
    if (isProcessing || !prices.productId) return;
    
    setIsProcessing(true);
    
    try {
      const result = await pay({
        amount: prices.ton,
        type: 'requests',
        quantity: prices.quantity,
        // productId: prices.productId
      });

      // Обработка результата оплаты
      switch (result.status) {
        case 'success':
          trackButtonClick('requests_purchase_success', {
            payment_method: 'ton',
            requests_count: selectedRequests,
            price: prices.ton,
            quantity: prices.quantity,
            product_id: prices.productId
          });
          alert(t('paymentSuccess'));
          onClose();
          break;
          
        case 'rejected':
          trackButtonClick('requests_purchase_rejected', {
            payment_method: 'ton',
            requests_count: selectedRequests,
            product_id: prices.productId
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
            error: result.status,
            product_id: prices.productId
          });
          alert(t('paymentError'));
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      trackButtonClick('requests_purchase_exception', {
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
    
    trackButtonClick('requests_purchase_attempt', {
      payment_method: 'stars', 
      requests_count: selectedRequests,
      price: prices.stars,
      quantity: prices.quantity,
      product_id: prices.productId
    });
    console.log("Buying", prices.quantity, "requests with stars for", prices.stars, "stars", {
      productId: prices.productId
    });
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
          {requestOptions.map((option) => (
            <div
              key={option.label}
              className={`${styles.option} ${
                selectedRequests === option.label ? styles.selected : ""
              }`}
              onClick={() => handleOptionSelect(option.label)}
            >
              <div className={styles.optionText}>
                {option.label.replace("requests", "").trim()}
              </div>
              {selectedRequests === option.label && (
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
                  {isProcessing ? t('processing') : `${prices.ton.toFixed(2)}`}
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
                  {formattedStars}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};