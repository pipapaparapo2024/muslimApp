import React from "react";
import styles from "./ModalPrayer.module.css";
import { useNavigate } from "react-router-dom";
import { type PrayerSetting } from "../../../pages/Settings/appSettings/settingPlayerTimes/SettingPrayerTimesStore";
import { Pen } from "lucide-react";
import { t } from "i18next";

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
          {/* Используем перевод для названия молитвы */}
          <h2>{t(prayer.originalName)}</h2>
          <button className={styles.closeButton} onClick={onRequestClose}>
            ×
          </button>
        </div>

        {/* Используем перевод для описания молитвы */}
        <p className={styles.modalDescription}>{t(`${prayer.originalName}Description`)}</p>

        <div className={styles.prayerTime}>
          <button
            className={styles.editButton}
            onClick={() => navigate("/settings/prayerTimes")}
          >
            <div><Pen size={20}/></div>
            {t("editPrayerTimes")}
          </button>
        </div>
      </div>
    </div>
  );
};