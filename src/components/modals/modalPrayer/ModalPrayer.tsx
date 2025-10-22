import React from "react";
import styles from "./ModalPrayer.module.css";
import { useNavigate } from "react-router-dom";
import { type Prayers } from "../../../hooks/usePrayerApiStore";
import { Pen } from "lucide-react";
import { useTranslationsStore } from "../../../hooks/useTranslations";

interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  prayer: Prayers;
  settings?: boolean;
}

export const ModalPrayer: React.FC<ModalProps> = ({
  isOpen,
  onRequestClose,
  prayer,
  settings = true,
}) => {
  const navigate = useNavigate();
  const { translations } = useTranslationsStore();
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
        {settings && <div className={styles.prayerTime}>
          <button
            className={styles.editButton}
            onClick={() => navigate("/settings/prayerTimes")}
          >
            <div>
              <Pen size={20} />
            </div>
            {translations?.settings}
          </button>
        </div>}

      </div>
    </div>
  );
};