import React from "react";
import { PageWrapper } from "../../../../shared/PageWrapper";
import styles from "./DataTime.module.css";
import { Check } from "lucide-react";
import { useDataTimeStore } from "../../../../hooks/useDataTimeStore";
import { trackButtonClick } from "../../../../api/analytics";
import { useTranslationsStore } from "../../../../hooks/useTranslations";

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
  const {
    is24Hour,
    isAutoTime,
    selectedDateFormat,
    set24Hour,
    setAutoTime,
    setSelectedDateFormat,
  } = useDataTimeStore();
  const { translations } = useTranslationsStore();
  const handle24HourToggle = (checked: boolean) => {
    checked
      ? trackButtonClick("date_format", "click_on_24h")
      : trackButtonClick("date_format", "click_off_24h");
    set24Hour(checked);
  };

  const handleAutoTimeToggle = (checked: boolean) => {
    checked
      ? trackButtonClick("date_format", "click_on_set_automatically")
      : trackButtonClick("date_format", "click_off_set_automatically");
    setAutoTime(checked);
  };

  const handleSelect = (formatKey: string) => {
    trackButtonClick("date_format", "date_format", JSON.stringify({ date_format: formatKey }));
    setSelectedDateFormat(formatKey);
  };

  return (
    <PageWrapper showBackButton navigateTo="/settings">
      {/* Time Format */}
      <div className={styles.timeFormat}>
        <div className={styles.titleTime}>{translations?.timeFormat}</div>
        <div className={styles.blockTime}>
          {/* 24-Hour Time */}
          <label className={styles.toggleItem}>
            <span className={styles.showMain}>{translations?.hourTime}</span>
            <input
              type="checkbox"
              checked={is24Hour}
              onChange={(e) => handle24HourToggle(e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
          </label>

          {/* Set Automatically */}
          <label className={styles.toggleItem}>
            <span className={styles.showMain}>
              {translations?.setAutomatically}
            </span>
            <input
              type="checkbox"
              checked={isAutoTime}
              onChange={(e) => handleAutoTimeToggle(e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
      </div>

      {/* Date Format */}
      <div className={styles.dateFormat}>
        <div className={styles.titleTime}> {translations?.dateFormat}</div>
        <div className={styles.blockDate}>
          {DATE_FORMATS.map((format) => (
            <div
              key={format.key}
              className={`${styles.dateOption} ${selectedDateFormat === format.key ? styles.selected : ""
                }`}
              onClick={() => handleSelect(format.key)}
            >
              <div
                className={`${styles.dateText} ${selectedDateFormat === format.key ? styles.selectedDate : ""
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
