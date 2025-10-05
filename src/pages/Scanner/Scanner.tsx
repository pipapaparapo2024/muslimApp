import React, { useEffect, useState } from "react";
import { PageWrapper } from "../../shared/PageWrapper";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { Camera, TriangleAlert, Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
import { useNavigate } from "react-router-dom";
import analyze from "../../assets/image/scan.png";
import styles from "./Scanner.module.css";
import { trackButtonClick } from "../../api/analytics";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react"; // Добавляем импорт
import { useTranslationsStore } from "../../hooks/useTranslations";

export const Scanner: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = usePremiumStore();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { translations } = useTranslationsStore();
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const showAskButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

  const handleScanClick = async () => {
    if (showAskButton) {
      // 📊 Аналитика: пользователь переходит к сканированию
      trackButtonClick("scan_button_click", {
        action: "open_camera",
        has_premium: hasPremium,
        requests_left: requestsLeft,
      });
      navigate("/scanner/camera");
    } else {
      // 📊 Аналитика: попытка сканировать без запросов → проверка кошелька
      trackButtonClick("scan_button_click", {
        action: "check_wallet_for_requests",
        has_premium: hasPremium,
        requests_left: requestsLeft,
        wallet_connected: !!userAddress,
      });

      if (!userAddress) {
        trackButtonClick("wallet_connection_triggered", {
          context: "buy_requests_scanner",
        });
        await tonConnectUI.openModal();
        return;
      }

      setShowModal(true);
    }
  };

  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return translations?.scanPicture;
    }
    return translations?.buyRequests;
  };

  return (
    <PageWrapper showBackButton navigateTo="/home">
      <div className={styles.container}>
        <div className={styles.table}>
          <TableRequestsHistory text="/scanner/historyScanner" />
        </div>

        <div className={styles.content}>
          <div className={styles.illustration}>
            <img src={analyze} alt={translations?.scanIllustration} />
          </div>

          <div className={styles.halalCheck}>
            <span> {translations?.instantHalalCheck}</span>
            <p> {translations?.takePhotoCheck}</p>
            <p className={styles.warning}>
              <TriangleAlert
                strokeWidth={1.5}
                size={18}
                color="white"
                fill="#F59E0B"
              />
              {translations?.informationalOnly}
            </p>
          </div>
        </div>

        <div className={styles.scanButtonContainer}>
          <button className={styles.submitButton} onClick={handleScanClick}>
            {showAskButton ? (
              <Camera strokeWidth={1.5} />
            ) : (
              <Wallet strokeWidth={1.5} />
            )}
            {getButtonText()}
          </button>
        </div>
      </div>

      <BuyRequestsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedRequests={selectedRequests}
        onSelectRequests={setSelectedRequests}
      />
    </PageWrapper>
  );
};
