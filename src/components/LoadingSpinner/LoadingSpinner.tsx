// src/components/shared/LoadingSpinner.tsx

import React from "react";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  text?: string; // Опциональный текст под спинером
  size?: "small" | "medium" | "large"; // Размер спинера
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "",
  size = "medium",
}) => {
  return (
    <div className={styles.spinnerContainer}>
      <div className={`${styles.spinner} ${styles[size]}`}></div>
      {text && <p className={styles.spinnerText}>{text}</p>}
    </div>
  );
};