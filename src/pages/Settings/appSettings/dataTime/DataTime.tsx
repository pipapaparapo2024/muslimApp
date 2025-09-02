import React from "react";
import { PageWrapper } from "../../../../shared/PageWrapper";
import styles from "./DataTime.module.css";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useGeoStore } from "../../../../hooks/useGeoStore";
import { useDataTimeStore } from "../../../../hooks/useDataTimeStore";
import { useLanguage } from "../../../../hooks/useLanguages";
import { t } from "i18next";
// Получаем текущую дату
const today = new Date();
const day = String(today.getDate()).padStart(2, "0");
const month = String(today.getMonth() + 1).padStart(2, "0");
const year = today.getFullYear();
const yearStr = String(year);

// Список форматов даты
const DATE_FORMATS = [
  { key: "dd.MM.yyyy", value: `${day}.${month}.${year}` },
  { key: "yyyy.MM.dd", value: `${year}.${month}.${day}` },
  { key: "dd/MM/yyyy", value: `${day}/${month}/${year}` },
  { key: "dd/M/yy", value: `${day}/${month}/${yearStr.slice(-2)}` },
  { key: "M/dd/yy", value: `${month}/${day}/${yearStr.slice(-2)}` },
  { key: "M/dd/yyyy", value: `${month}/${day}/${year}` },
  { key: "yyyy/M/dd", value: `${year}/${month}/${day}` },
  { key: "dd-MM-yyyy", value: `${day}-${month}-${year}` },
  { key: "yyyy-MM-dd", value: `${year}-${month}-${day}` },
];

export const DataTime: React.FC = () => {
  const { ipData } = useGeoStore();
  const { language } = useLanguage();
  // Zustand store
  const {
    is24Hour,
    isAutoTime,
    selectedDateFormat,
    set24Hour,
    setAutoTime,
    setSelectedDateFormat,
  } = useDataTimeStore();

  const handleSelect = (formatKey: string) => {
    setSelectedDateFormat(formatKey);
  };

  return (
    <PageWrapper showBackButton>
      {/* Time Format */}
      <div className={styles.timeFormat}>
        <div className={styles.titleTime}>{t("timeFormat")}</div>
        <div className={styles.blockTime}>
          {/* 24-Hour Time */}
          <label className={styles.toggleItem}>
            <span className={styles.showMain}>{t("hourTime")}</span>
            <input
              type="checkbox"
              checked={is24Hour}
              onChange={(e) => set24Hour(e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
          </label>

          {/* Set Automatically */}
          <label className={styles.toggleItem}>
            <span className={styles.showMain}>{t("setAutomatically")}</span>
            <input
              type="checkbox"
              checked={isAutoTime}
              onChange={(e) => setAutoTime(e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
          </label>

          {/* Time zone */}
          <div className={styles.toggleItem}>
            <span className={styles.showMain}>{t("timeZone")}</span>
            <div className={styles.timeZone}>
              <span className={styles.timeZoneValue}>{ipData?.timeZone}</span>
              {language === "ar" ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Format */}
      <div className={styles.dateFormat}>
        <div className={styles.titleTime}>{t("dateFormat")}</div>
        <div className={styles.blockDate}>
          {DATE_FORMATS.map((format) => (
            <div
              key={format.key}
              className={`${styles.dateOption} ${
                selectedDateFormat === format.key ? styles.selected : ""
              }`}
              onClick={() => handleSelect(format.key)}
            >
              <div
                className={`${styles.dateText} ${
                  selectedDateFormat === format.key ? styles.selectedDate : ""
                }`}
              >
                {format.value}
              </div>
              {selectedDateFormat === format.key && <Check size={20} />}
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};
