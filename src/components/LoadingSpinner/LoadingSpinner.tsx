// src/components/shared/LoadingSpinner.tsx

import React from "react";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"; 
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
}) => {
  return (
    <div className={styles.spinnerContainer}>
      <div className={`${styles.spinner} ${styles[size]}`}></div>
    </div>
  );
};