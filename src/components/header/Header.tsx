import React, { useEffect, useState } from "react";
import styles from "./Header.module.css";
import { BuyPremiumModal } from "../modals/modalBuyPremium/ModalBuyPremium";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { useDataTimeStore } from "../../hooks/useDataTimeStore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGeoStore } from "../../hooks/useGeoStore";
import { trackButtonClick } from "../../api/analytics";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";

export const Header: React.FC = () => {
  const { formattedDate, updateFormattedDate } = useDataTimeStore();
  const { hasPremium, premiumDaysLeft, fetchUserData } = usePremiumStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { city, country } = useGeoStore();
  
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  // ✅ Добавляем проверку статуса подключения
  const [isConnecting, setIsConnecting] = useState(false);

  React.useEffect(() => {
    trackButtonClick('header_loaded', {
      has_premium: hasPremium,
      premium_days_left: premiumDaysLeft || 0,
      location_available: !!(city && country),
      wallet_connected: !!userAddress
    });
  }, []);

  const getButtonText = () => {
    if (!hasPremium) return t("buyPremium");
    if (!premiumDaysLeft) return t("premiumActive");
    if (premiumDaysLeft > 0) {
      return `${premiumDaysLeft} ${t("daysLeft")}`;
    } else {
      return t("buyPremium");
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    updateFormattedDate();
  }, []);

  const getButtonClassName = () => {
    if (!hasPremium) return styles.buyPremiumButton;
    return styles.DaysLeftPrem;
  };

  const handlePremiumButtonClick = async () => {
    trackButtonClick('premium_buy_click', {
      current_status: hasPremium ? 'premium_active' : 'no_premium',
      days_left: premiumDaysLeft || 0,
      button_text: getButtonText(),
      wallet_connected: !!userAddress
    });

    if (!userAddress) {
      trackButtonClick('wallet_connection_triggered', {
        context: 'premium_purchase'
      });
      
      try {
        setIsConnecting(true);
        await tonConnectUI.openModal();
      } catch (error) {
        console.error('Wallet connection error:', error);
        trackButtonClick('wallet_connection_failed', {
          error: error instanceof Error ? error.message : 'unknown'
        });
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    setShowModal(true);
  };

  const handleDateClick = () => {
    trackButtonClick('date_click', {
      current_date: formattedDate,
      destination: '/settings/dateTime'
    });
    navigate("/settings/dateTime");
  };

  const handleModalClose = () => {
    trackButtonClick('premium_modal_close', {
      selected_requests: selectedRequests,
      session_duration: 'short'
    });
    setShowModal(false);
  };

  return (
    <div className={styles.header}>
      <div className={styles.locationInfo}>
        <div className={styles.cityName}>
          {country || "Unknown"}, {city || "Unknown"}
        </div>
        <div
          onClick={handleDateClick}
          className={styles.formattedDate}
        >
          {formattedDate}
        </div>
      </div>

      <button
        className={getButtonClassName()}
        onClick={handlePremiumButtonClick}
        disabled={isConnecting} // ✅ Блокируем кнопку при подключении
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ваш SVG код */}
        </svg>

        {isConnecting ? t("connecting") : getButtonText()}
      </button>

      <BuyPremiumModal
        isOpen={showModal}
        onClose={handleModalClose}
        selectedRequests={selectedRequests}
        onSelectRequests={(value) => {
          trackButtonClick('premium_requests_change', {
            from_value: selectedRequests,
            to_value: value
          });
          setSelectedRequests(value);
        }}
      />
    </div>
  );
};