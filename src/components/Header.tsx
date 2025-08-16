import React, { useState } from "react";
import styles from "../pages/Home/Home.module.css";
import moon_star from "../assets/icons/mooStar .svg";
import { BuyPremiumModal } from "./modals/modalBuyPremium/ModalBuyPremium";

interface HeaderProps {
  city: string;
  country: string;
}

export const Header: React.FC<HeaderProps> = ({ country, city }) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState(10);

  return (
    <div className={styles.header}>
      <div className={styles.locationInfo}>
        <span className={styles.cityName}>
          {country || "Unknown"},{city || "Unknown"}
        </span>
        <span className={styles.currentDate}>{currentDate}</span>
      </div>
      <button
        className={styles.buyPremiumButton}
        onClick={() => setShowModal(true)}
      >
        <img src={moon_star} alt="" />
        Buy Premium
      </button>

      <BuyPremiumModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedRequests={selectedRequests}
        onSelectRequests={setSelectedRequests}
      />
    </div>
  );
};
