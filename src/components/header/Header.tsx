import React, { useEffect, useState } from "react";
import styles from "./Header.module.css"
import { BuyPremiumModal } from "../modals/modalBuyPremium/ModalBuyPremium";
import { useQnAStore } from "../../hooks/useQnAStore";
import { useDataTimeStore } from "../../pages/Settings/appSettings/dataTime/DataTimeStore";
import { useNavigate } from "react-router-dom";
interface HeaderProps {
  city: string;
  country: string;
}

export const Header: React.FC<HeaderProps> = ({ country, city }) => {
  const { formattedDate } = useDataTimeStore();
  const { hasPremium, premiumTimeLeft, fetchUserData } = useQnAStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
const navigate=useNavigate()
  const getButtonText = () => {
    if (!hasPremium) return "Buy Premium";
    if (!premiumTimeLeft) return "Premium Active";

    if (premiumTimeLeft.days > 0) {
      return `${premiumTimeLeft.days} Days Left`;
    } else if (premiumTimeLeft.totalHours > 0) {
      return `${premiumTimeLeft.totalHours} Hours Left`;
    } else {
      return "Buy Premium";
    }
  };
  useEffect(() => {
    fetchUserData();
  }, []);

  const handlePremiumButtonClick = () => {
    if (!hasPremium || (premiumTimeLeft && premiumTimeLeft.totalHours <= 0)) {
      setShowModal(true);
    }
  };

  const getButtonClassName = () => {
    if (!hasPremium) return styles.buyPremiumButton;

    if (premiumTimeLeft && premiumTimeLeft.totalHours > 0) {
      return styles.DaysLeftPrem;
    } else {
      return styles.DaysLeftPrem;
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.locationInfo}>
        <div className={styles.cityName}>
          {country || "Unknown"}, {city || "Unknown"}
        </div>
        <div onClick={()=>navigate("/settings/dateTime")} className={styles.formattedDate}>{formattedDate}</div>
      </div>

      <button
        className={getButtonClassName()}
        onClick={handlePremiumButtonClick}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_1174_1025)">
            <path
              d="M15 1.66663L15.5148 2.69628C15.736 3.13876 15.8466 3.36 15.9945 3.55172C16.1255 3.72184 16.278 3.87435 16.4482 4.00549C16.6399 4.15327 16.8611 4.26389 17.3036 4.48513L18.3333 4.99996L17.3036 5.51478C16.8611 5.73603 16.6399 5.84665 16.4482 5.99443C16.278 6.12557 16.1255 6.27808 15.9945 6.4482C15.8466 6.63992 15.736 6.86116 15.5148 7.30364L15 8.33329L14.4851 7.30364C14.2639 6.86116 14.1533 6.63992 14.0055 6.4482C13.8744 6.27808 13.7219 6.12557 13.5517 5.99443C13.36 5.84665 13.1388 5.73603 12.6963 5.51478L11.6666 4.99996L12.6963 4.48513C13.1388 4.26389 13.36 4.15327 13.5517 4.00549C13.7219 3.87435 13.8744 3.72184 14.0055 3.55172C14.1533 3.36 14.2639 3.13876 14.4851 2.69628L15 1.66663Z"
              stroke="var(--text)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M17.5 11.1578C16.4075 13.0742 14.3454 14.3663 11.9815 14.3663C8.47588 14.3663 5.63392 11.5243 5.63392 8.01861C5.63392 5.65462 6.9262 3.59245 8.84288 2.5C4.81645 2.88177 1.66663 6.27243 1.66663 10.3988C1.66663 14.7809 5.21906 18.3333 9.60121 18.3333C13.7274 18.3333 17.1179 15.1838 17.5 11.1578Z"
              stroke="var(--text)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_1174_1025">
              <rect width="20" height="20" fill="white" />
            </clipPath>
          </defs>
        </svg>

        {getButtonText()}
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
