import React from "react";
import styles from "./ModalPrayer.module.css";
import { useNavigate } from "react-router-dom";
import { type PrayerSetting } from "../../../pages/Settings/appSettings/settingPlayerTimes/SettingPrayerTimesStore";
import { Pen } from "lucide-react";
interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  prayer: PrayerSetting;
}

export const ModalPrayer: React.FC<ModalProps> = ({
  isOpen,
  onRequestClose,
  prayer,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !prayer) return null;

  return (
    <div className={styles.modalOverlay} onClick={onRequestClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{prayer.name}</h2>
          <button className={styles.closeButton} onClick={onRequestClose}>
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>{prayer.description}</p>

        <div className={styles.prayerTime}>
          <button
            className={styles.editButton}
            onClick={() => navigate("/settings/prayerTimes")}
          >
            <div><Pen size={20}/></div>
            Edit Prayer Times
          </button>
        </div>
      </div>
    </div>
  );
};
