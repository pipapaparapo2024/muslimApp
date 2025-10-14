import React, { useEffect, useState } from "react";
import styles from "./ModalBuyPremium.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTonPay } from "../../../hooks/useTonPay";
import { usePrices } from "../../../hooks/usePrices";
import { useStarsPay } from "../../../hooks/useStarsPay";
import { usePremiumStore } from "../../../hooks/usePremiumStore";
import { useTranslationsStore } from "../../../hooks/useTranslations";

interface BuyPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: string;
  onSelectRequests: (count: string) => void;
}

export const BuyPremiumModal: React.FC<BuyPremiumModalProps> = ({
  isOpen,
  onClose,
  selectedRequests,
  onSelectRequests,
}) => {
  const { translations } = useTranslationsStore();
  const { fetchUserData } = usePremiumStore();
  const { getProductsByType, getPriceByProductId } = usePrices();
  const { payWithTon } = useTonPay();
  const { payWithStars } = useStarsPay();
  const [isProcessingTon, setIsProcessingTon] = useState(false);
  const [isProcessingStars, setIsProcessingStars] = useState(false);

  const premiumProducts = getProductsByType("premium");

  const premiumOptions = premiumProducts
    .map((product) => ({
      label: product.title,
      days: product.revardAmount,
      product,
    }))
    .sort((a, b) => a.days - b.days);

  // ✅ Автоматически выбираем первый вариант при открытии
  useEffect(() => {
    if (isOpen && premiumOptions.length > 0) {
      onSelectRequests(premiumOptions[0].label);
    }
  }, [isOpen, premiumOptions]);

  const prices = (() => {
    const option = premiumOptions.find((opt) => opt.label === selectedRequests);
    if (!option) return { ton: 0, stars: 0, productId: null, currencyId: null, days: 0 };
    const tonCurrency = getPriceByProductId(option.product.id, "TON");
    const starsCurrency = getPriceByProductId(option.product.id, "XTR");
    return {
      ton: tonCurrency?.priceAmount || 1,
      stars: starsCurrency?.priceAmount || 1,
      productId: option.product.id,
      currencyId: starsCurrency?.id,
      days: option.days,
    };
  })();

  const handleTonPurchase = async () => {
    if (isProcessingTon || isProcessingStars || !prices.productId) return;
    setIsProcessingTon(true);
    try {
      const result = await payWithTon({
        amount: prices.ton,
        type: "premium",
        duration: prices.days,
        productId: prices.productId,
      });
      if (result.status === "success") {
        await fetchUserData();
        onClose();
      }
    } finally {
      setIsProcessingTon(false);
    }
  };

  const handleStarsPurchase = async () => {
    if (isProcessingTon || isProcessingStars || !prices.productId || !prices.currencyId) return;
    setIsProcessingStars(true);
    try {
      const result = await payWithStars({
        productId: prices.productId,
        currencyId: prices.currencyId,
      });
      if (result.status === "success") {
        await fetchUserData();
        onClose();
      }
    } finally {
      setIsProcessingStars(false);
    }
  };

  if (!isOpen) return null;

  const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const formattedStars = formatNumber(prices.stars);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{translations?.goPremium}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.options}>
          {premiumOptions.map((option) => (
            <div
              key={option.label}
              className={`${styles.option} ${selectedRequests === option.label ? styles.selected : ""}`}
              onClick={() => onSelectRequests(option.label)}
            >
              {option.label}
              {selectedRequests === option.label && <Check size={20} />}
            </div>
          ))}
        </div>

        <div className={styles.priceBlocks}>
          <div className={`${styles.priceBlock} ${styles.tonBlock}`} onClick={handleTonPurchase}>
            <img src={ton} alt="TON" width={24} height={24} />
            <span>{(prices.ton * 0.000000001).toFixed(5)}</span>
          </div>

          <div className={`${styles.priceBlock} ${styles.starsBlock}`} onClick={handleStarsPurchase}>
            <img src={star} alt="Stars" width={24} height={24} />
            <span>{formattedStars}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
