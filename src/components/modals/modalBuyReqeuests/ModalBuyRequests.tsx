// import React from "react";
// import styles from "./ModalBuyRequests.module.css";
// import ton from "../../../assets/icons/ton.svg";
// import star from "../../../assets/icons/star.svg";
// import { Check } from "lucide-react";
// import { useTonPay } from "../../../hooks/useTonPay";
// import { usePrices } from "../../../hooks/usePrices";
// import { useStarsPay } from "../../../hooks/useStarsPay";
// import { usePremiumStore } from "../../../hooks/usePremiumStore";
// import { useTranslationsStore } from "../../../hooks/useTranslations";
// interface BuyRequestsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   selectedRequests: string;
//   onSelectRequests: (count: string) => void;
// }

// const formatNumber = (num: number): string => {
//   return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
// };

// export const BuyRequestsModal: React.FC<BuyRequestsModalProps> = ({
//   isOpen,
//   onClose,
//   selectedRequests,
//   onSelectRequests,
// }) => {
//   const { translations } = useTranslationsStore();
//   const { fetchUserData } = usePremiumStore();
//   const {
//     getProductsByType,
//     getPriceByProductId,
//     loading: pricesLoading,
//   } = usePrices();
//   const { payWithTon, isConnected } = useTonPay();
//   const { payWithStars } = useStarsPay();
//   const [isProcessingTon, setIsProcessingTon] = React.useState(false);
//   const [isProcessingStars, setIsProcessingStars] = React.useState(false);

//   const requestsProducts = getProductsByType("requests");

//   const getRequestOptions = () => {
//     return requestsProducts
//       .map((product) => {
//         const requests = product.revardAmount;
//         return {
//           label: `${requests} ${translations?.requests}`,
//           quantity: requests,
//           product,
//         };
//       })
//       .sort((a, b) => a.quantity - b.quantity);
//   };

//   const requestOptions = getRequestOptions();

//   const getPrices = (optionLabel: string) => {
//     const option = requestOptions.find((opt) => opt.label === optionLabel);

//     if (!option) {
//       return {
//         ton: 1,
//         stars: 1,
//         quantity: parseInt(optionLabel.split(" ")[0]) || 10,
//         productId: null,
//         currencyId: null,
//       };
//     }

//     const tonCurrency = getPriceByProductId(option.product.id, "TON");
//     const starsCurrency = getPriceByProductId(option.product.id, "XTR");

//     console.log("🔄 getPrices for requests option:", {
//       optionLabel,
//       productId: option.product.id,
//       productTitle: option.product.title,
//       tonCurrency,
//       starsCurrency,
//     });

//     return {
//       ton: tonCurrency?.priceAmount || 1,
//       stars: starsCurrency?.priceAmount || 1,
//       quantity: option.quantity,
//       productId: option.product.id,
//       currencyId: starsCurrency?.id,
//     };
//   };

//   const prices = selectedRequests
//     ? getPrices(selectedRequests)
//     : {
//         ton: 0,
//         stars: 0,
//         quantity: 0,
//         productId: null,
//         currencyId: null,
//       };

//   const handleStarsPurchase = async () => {
//     if (
//       isProcessingTon ||
//       isProcessingStars ||
//       !prices.productId ||
//       !prices.currencyId
//     ) {
//       console.log("❌ Missing required data for requests purchase:", {
//         productId: prices.productId,
//         currencyId: prices.currencyId,
//         selectedRequests: selectedRequests,
//         requestOptionsCount: requestOptions.length,
//       });
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
//           // Обновляем данные пользователя после успешной покупки
//           await fetchUserData();
//           onClose();
//           break;

//         case "insufficient_funds":
//           // alert(translations?.insufficientStars);
//           alert("insufficient_funds");
//           break;

//         default:
//           // alert(translations?.paymentError);
//           alert("ошибка оплаты");
//       }
//     } catch (error: any) {
//       console.error("Stars payment error for requests:", error);
//       // alert(translations?.paymentError);
//       alert("ошибка оплаты");
//     } finally {
//       setIsProcessingStars(false);
//     }
//   };

//   React.useEffect(() => {
//     if (isOpen && requestOptions.length > 0) {
//       onSelectRequests(requestOptions[0].label);
//     }
//   }, [isOpen, requestOptions]);

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
//         type: "requests",
//         quantity: prices.quantity,
//         productId: prices.productId,
//       });

//       switch (result.status) {
//         case "success":
//           // alert(translations?.paymentSuccess);
//           alert("success");
//           onClose();
//           break;

//         case "rejected":
//           // alert(translations?.paymentRejected);
//           alert("rejected");
//           break;

//         case "not_connected":
//           break;

//         default:
//           // alert(translations?.paymentError);
//           alert("ошибка оплаты");
//       }
//     } catch (error: any) {
//       console.error("TON payment error for requests:", error);
//       // alert(translations?.paymentError);
//       alert("ошибка оплаты");
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
//           <h2>{translations?.buyRequests}</h2>
//           <button className={styles.closeButton} onClick={handleClose}>
//             ×
//           </button>
//         </div>

//         <p className={styles.modalDescription}>
//           {translations?.requestsDescription}
//         </p>

//         <div className={styles.options}>
//           {requestOptions.map((option) => (
//             <div
//               key={option.label}
//               className={`${styles.option} ${
//                 selectedRequests === option.label ? styles.selected : ""
//               }`}
//               onClick={() => handleOptionSelect(option.label)}
//             >
//               <div>{option.label}</div>
//               {selectedRequests === option.label && <Check size={20} />}
//             </div>
//           ))}
//         </div>

//         <div className={styles.priceBlocks}>
//           <div
//             className={`${styles.priceBlock} ${styles.tonBlock} ${
//               isProcessingTon ? styles.processing : ""
//             }`}
//             onClick={handleTonPurchase}
//           >
//             <div className={styles.priceText}>
//               <img src={ton} alt="TON" width="24" height="24" />
//               <div className={styles.priceValueTon}>
//                 {(prices.ton / 10e9).toFixed(10)}
//               </div>
//             </div>
//             {!isConnected && !isProcessingTon && (
//               <div className={styles.connectHint}>
//                 {translations?.connectWalletToPay}
//               </div>
//             )}
//           </div>

//           <div
//             className={`${styles.priceBlock} ${styles.starsBlock} ${
//               isProcessingStars ? styles.processing : ""
//             }`}
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
import styles from "./ModalBuyRequests.module.css";
import ton from "../../../assets/icons/ton.svg";
import star from "../../../assets/icons/star.svg";
import { Check } from "lucide-react";
import { useTonPay } from "../../../hooks/useTonPay";
import { usePrices } from "../../../hooks/usePrices";
import { useStarsPay } from "../../../hooks/useStarsPay";
import { usePremiumStore } from "../../../hooks/usePremiumStore";
import { useTranslationsStore } from "../../../hooks/useTranslations";

interface BuyRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests?: string; // делаем optional
  onSelectRequests: (count: string) => void;
}

export const BuyRequestsModal: React.FC<BuyRequestsModalProps> = ({
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
  const [isProcessingTon, setIsProcessingTon] = React.useState(false);
  const [isProcessingStars, setIsProcessingStars] = React.useState(false);

  const requestOptions = getProductsByType("requests")
    .map((p) => ({
      label: `${p.revardAmount} ${translations?.requests}`,
      quantity: p.revardAmount,
      product: p,
    }))
    .sort((a, b) => a.quantity - b.quantity);

  // ✅ Выбираем первый вариант сразу, если selectedRequests пуст
  const currentSelection = selectedRequests || requestOptions[0]?.label;

  const selectedOption = requestOptions.find(
    (opt) => opt.label === currentSelection
  );

  const prices = selectedOption
    ? {
        ton: getPriceByProductId(selectedOption.product.id, "TON")?.priceAmount || 1,
        stars: getPriceByProductId(selectedOption.product.id, "XTR")?.priceAmount || 1,
        productId: selectedOption.product.id,
        currencyId: getPriceByProductId(selectedOption.product.id, "XTR")?.id,
        quantity: selectedOption.quantity,
      }
    : { ton: 0, stars: 0, productId: null, currencyId: null, quantity: 0 };

  const formatNumber = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const formattedStars = formatNumber(prices.stars);

  if (!isOpen) return null;

  const handleTonPurchase = async () => {
    if (isProcessingTon || isProcessingStars || !prices.productId) return;
    setIsProcessingTon(true);
    try {
      const result = await payWithTon({
        amount: prices.ton,
        type: "requests",
        quantity: prices.quantity,
        productId: prices.productId,
      });
      if (result.status === "success") await fetchUserData();
    } finally {
      setIsProcessingTon(false);
      onClose();
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
      if (result.status === "success") await fetchUserData();
    } finally {
      setIsProcessingStars(false);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{translations?.buyRequests}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.options}>
          {requestOptions.map((option) => (
            <div
              key={option.label}
              className={`${styles.option} ${
                currentSelection === option.label ? styles.selected : ""
              }`}
              onClick={() => onSelectRequests(option.label)}
            >
              {option.label}
              {currentSelection === option.label && <Check size={20} />}
            </div>
          ))}
        </div>

        <div className={styles.priceBlocks}>
          <div className={styles.priceBlock} onClick={handleTonPurchase}>
            <img src={ton} alt="TON" width={24} height={24} />
            <span>{(prices.ton * 0.000000001).toFixed(5)}</span>
          </div>
          <div className={styles.priceBlock} onClick={handleStarsPurchase}>
            <img src={star} alt="Stars" width={24} height={24} />
            <span>{formattedStars}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
