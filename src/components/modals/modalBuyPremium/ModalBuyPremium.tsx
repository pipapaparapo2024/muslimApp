// import React from "react";
// import styles from "./ModalBuyPremium.module.css";
// import ton from "../../../assets/icons/ton.svg";
// import star from "../../../assets/icons/star.svg";
// import { Check } from "lucide-react";
// import { useTonPay } from "../../../hooks/useTonPay";
// import { usePrices } from "../../../hooks/usePrices";
// import { useStarsPay } from "../../../hooks/useStarsPay";
// import { usePremiumStore } from "../../../hooks/usePremiumStore";
// import { useTranslationsStore } from "../../../hooks/useTranslations";
// interface BuyPremiumModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   selectedRequests: string;
//   onSelectRequests: (count: string) => void;
// }

// const formatNumber = (num: number): string => {
//   return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
// };

// export const BuyPremiumModal: React.FC<BuyPremiumModalProps> = ({
//   isOpen,
//   onClose,
//   selectedRequests,
//   onSelectRequests,
// }) => {
//   const { translations } = useTranslationsStore();
//   const {
//     getProductsByType,
//     getPriceByProductId,
//     loading: pricesLoading,
//   } = usePrices();
//   const { fetchUserData } = usePremiumStore();
//   const { payWithTon, isConnected } = useTonPay();
//   const { payWithStars } = useStarsPay();
//   const [isProcessingTon, setIsProcessingTon] = React.useState(false);
//   const [isProcessingStars, setIsProcessingStars] = React.useState(false);

//   const premiumProducts = getProductsByType("premium");

//   const getPremiumOptions = () => {
//     return premiumProducts
//       .map((product) => {
//         const days = product.revardAmount;
//         let label = product.title;
//         // if (days === 7) label = `1 ${t("week")}`;
//         // else if (days === 30) label = `1 ${t("month")}`;
//         // else if (days === 365) label = `1 ${t("year")}`;
//         // else label = `${days} ${t("days")}`;

//         return {
//           label,
//           days,
//           product,
//         };
//       })
//       .sort((a, b) => a.days - b.days);
//   };

//   const premiumOptions = getPremiumOptions();

//   // Используем getPriceByProductId для получения валюты конкретного продукта
//   const getPrices = (optionLabel: string) => {
//     const option = premiumOptions.find((opt) => opt.label === optionLabel);

//     if (!option) {
//       return {
//         ton: 1,
//         stars: 1,
//         duration: optionLabel,
//         productId: null,
//         currencyId: null,
//         days: 7,
//       };
//     }

//     // Используем getPriceByProductId для конкретного продукта
//     const tonCurrency = getPriceByProductId(option.product.id, "TON");
//     const starsCurrency = getPriceByProductId(option.product.id, "XTR");

//     return {
//       ton: tonCurrency?.priceAmount || 1,
//       stars: starsCurrency?.priceAmount || 1,
//       duration: optionLabel,
//       productId: option.product.id,
//       currencyId: starsCurrency?.id,
//       days: option.days,
//     };
//   };

//   const prices = selectedRequests
//     ? getPrices(selectedRequests)
//     : {
//       ton: 0,
//       stars: 0,
//       duration: "",
//       productId: null,
//       days: 0,
//       currencyId: null,
//     };

//   const handleStarsPurchase = async () => {
//     if (
//       isProcessingTon ||
//       isProcessingStars ||
//       !prices.productId ||
//       !prices.currencyId
//     ) {
//       return;
//     }

//     setIsProcessingStars(true);
//     try {
//       const result = await payWithStars({
//         currencyId: prices.currencyId,
//         productId: prices.productId,
//       });

//       switch (result.status) {
//         case "success":
//           break;

//         case "insufficient_funds":
//           alert(translations?.insufficientStars);
//           break;

//         default:
//           alert(translations?.paymentError);
//       }
//     } catch (error: any) {
//       console.error("Stars payment error:", error);
//       alert(translations?.paymentError);
//     } finally {
//       setIsProcessingStars(false);
//     }
//   };

//   React.useEffect(() => {
//     if (isOpen && premiumOptions.length > 0) {
//       onSelectRequests(premiumOptions[0].label);
//     }
//   }, []);

//   if (!isOpen) return null;

//   const formattedStars = formatNumber(prices.stars);

//   const handleClose = () => {
//     onClose();
//   };

//   const handleOptionSelect = (option: string) => {
//     onSelectRequests(option);
//   };

//   const handleTonPurchase = async () => {
//     if (isProcessingTon || isProcessingStars || !prices.productId) return;
//     setIsProcessingTon(true);

//     try {
//       const result = await payWithTon({
//         amount: prices.ton,
//         type: "premium",
//         duration: prices.duration,
//         productId: prices.productId,
//       });

//       switch (result.status) {
//         case "success":
//           alert(translations?.paymentSuccess);
//           await fetchUserData();
//           onClose();
//           break;

//         case "rejected":
//           alert(translations?.paymentError);
//           break;

//         default:
//       }
//     } catch (error: any) {
//       console.error("TON payment error:", error);
//       alert(translations?.paymentError);
//     } finally {
//       setIsProcessingTon(false);
//     }
//   };

//   if (pricesLoading) {
//     return (
//       <div className={styles.modalOverlay} onClick={handleClose}>
//         <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//           <div className={styles.loading}>Loading prices...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={styles.modalOverlay} onClick={handleClose}>
//       <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//         <div className={styles.modalHeader}>
//           <h2>{translations?.goPremium}</h2>
//           <button className={styles.closeButton} onClick={handleClose}>
//             ×
//           </button>
//         </div>

//         <p className={styles.modalDescription}>
//           {translations?.premiumDescription}
//         </p>

//         <div className={styles.options}>
//           {premiumOptions.map((option) => (
//             <div
//               key={option.label}
//               className={`${styles.option} ${selectedRequests === option.label ? styles.selected : ""
//                 }`}
//               onClick={() => handleOptionSelect(option.label)}
//             >
//               <div>{option.label}</div>
//               {selectedRequests === option.label && <Check size={20} />}
//             </div>
//           ))}
//         </div>

//         <div className={styles.priceBlocks}>
//           <div
//             className={`${styles.priceBlock} ${styles.tonBlock} ${isProcessingTon ? styles.processing : ""
//               }`}
//             onClick={handleTonPurchase}
//           >
//             <div className={styles.priceText}>
//               <img src={ton} alt="TON" width="24" height="24" />
//               <div className={styles.priceValueTon}>
//                 {(prices.ton * 0.000000001).toFixed(2)}
//               </div>
//             </div>
//             {!isConnected && !isProcessingTon && (
//               <div className={styles.connectHint}>
//                 {translations?.connectWalletToPay}
//               </div>
//             )}
//           </div>

//           <div
//             className={`${styles.priceBlock} ${styles.starsBlock} ${isProcessingStars ? styles.processing : ""
//               }`}
//             onClick={handleStarsPurchase}
//           >
//             <div className={styles.priceText}>
//               <img src={star} alt="Stars" width="24" height="24" />
//               <div className={`${styles.priceValueStar} ${styles.formatted}`}>
//                 {formattedStars}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };




import React from "react";
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

const formatNumber = (num: number): string =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const BuyPremiumModal: React.FC<BuyPremiumModalProps> = ({
  isOpen,
  onClose,
  selectedRequests,
  onSelectRequests,
}) => {
  const { translations } = useTranslationsStore();
  const { fetchUserData } = usePremiumStore();
  const { getProductsByType, getPriceByProductId, loading: pricesLoading } = usePrices();
  const { payWithTon, isConnected, isWaitingConfirmation } = useTonPay();
  const { payWithStars } = useStarsPay();
  const [isProcessingTon, setIsProcessingTon] = React.useState(false);
  const [isProcessingStars, setIsProcessingStars] = React.useState(false);

  const premiumProducts = getProductsByType("premium");

  const premiumOptions = premiumProducts
    .map((product) => ({
      label: product.title,
      days: product.revardAmount,
      product,
    }))
    .sort((a, b) => a.days - b.days);

  const getPrices = (optionLabel: string) => {
    const option = premiumOptions.find((opt) => opt.label === optionLabel);
    if (!option) return { ton: 1, stars: 1, duration: optionLabel, productId: null, currencyId: null, days: 7 };

    const tonCurrency = getPriceByProductId(option.product.id, "TON");
    const starsCurrency = getPriceByProductId(option.product.id, "XTR");

    return {
      ton: tonCurrency?.priceAmount || 1,
      stars: starsCurrency?.priceAmount || 1,
      duration: optionLabel,
      productId: option.product.id,
      currencyId: starsCurrency?.id,
      days: option.days,
    };
  };

  const prices = selectedRequests ? getPrices(selectedRequests) : { ton: 0, stars: 0, duration: "", productId: null, days: 0, currencyId: null };

  const handleStarsPurchase = async () => {
    if (isProcessingTon || isProcessingStars || !prices.productId || !prices.currencyId) return;
    setIsProcessingStars(true);

    try {
      const result = await payWithStars({ currencyId: prices.currencyId, productId: prices.productId });
      switch (result.status) {
        case "success":
          await fetchUserData();
          onClose();
          break;
        case "insufficient_funds":
          alert(translations?.insufficientStars);
          break;
        default:
          alert(translations?.paymentError);
      }
    } catch {
      alert(translations?.paymentError);
    } finally {
      setIsProcessingStars(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && premiumOptions.length > 0) {
      onSelectRequests(premiumOptions[0].label);
    }
  }, [isOpen]);

  const handleTonPurchase = async () => {
    if (isProcessingTon || isProcessingStars || !prices.productId) return;
    setIsProcessingTon(true);

    try {
      const result = await payWithTon({ amount: prices.ton, type: "premium", duration: prices.duration, productId: prices.productId });
      switch (result.status) {
        case "success":
          alert(translations?.paymentSuccess);
          onClose();
          break;
        case "rejected":
          alert(translations?.paymentError);
          break;
      }
    } catch {
      alert(translations?.paymentError);
    } finally {
      setIsProcessingTon(false);
    }
  };

  if (!isOpen) return null;

  const formattedStars = formatNumber(prices.stars);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{translations?.goPremium}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <p className={styles.modalDescription}>{translations?.premiumDescription}</p>

        <div className={styles.options}>
          {premiumOptions.map((option) => (
            <div
              key={option.label}
              className={`${styles.option} ${selectedRequests === option.label ? styles.selected : ""}`}
              onClick={() => onSelectRequests(option.label)}
            >
              <div>{option.label}</div>
              {selectedRequests === option.label && <Check size={20} />}
            </div>
          ))}
        </div>

        <div className={styles.priceBlocks}>
          <div
            className={`${styles.priceBlock} ${styles.tonBlock} ${isProcessingTon ? styles.processing : ""}`}
            onClick={handleTonPurchase}
          >
            <div className={styles.priceText}>
              <img src={ton} alt="TON" width="24" height="24" />
              <div className={styles.priceValueTon}>{(prices.ton * 0.000000001).toFixed(2)}</div>
            </div>
            {!isConnected && !isProcessingTon && <div className={styles.connectHint}>{translations?.connectWalletToPay}</div>}
          </div>

          <div
            className={`${styles.priceBlock} ${styles.starsBlock} ${isProcessingStars ? styles.processing : ""}`}
            onClick={handleStarsPurchase}
          >
            <div className={styles.priceText}>
              <img src={star} alt="Stars" width="24" height="24" />
              <div className={`${styles.priceValueStar} ${styles.formatted}`}>{formattedStars}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно ожидания */}
      {isWaitingConfirmation && (
        <div className={styles.waitingOverlay}>
          <div className={styles.waitingModal}>Пожалуйста, подождите...</div>
        </div>
      )}
    </div>
  );
};

