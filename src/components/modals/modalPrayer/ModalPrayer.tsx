import React from "react";
import styles from "./ModalPrayer.module.css";
import { useNavigate } from "react-router-dom";
import { type Prayers } from "../../../hooks/usePrayerApiStore";
import { Pen } from "lucide-react";
import { t } from "i18next";
interface CombinedPrayer extends Prayers {
  description?: string;
  hasTelegramNotification?: boolean;
}
interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  prayer: CombinedPrayer;
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
          <h2>{t(prayer.name)}</h2>
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
            <div>
              <Pen size={20} />
            </div>
            {t("editPrayerSettings")}
          </button>
        </div>
      </div>
    </div>
  );
};
