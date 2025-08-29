import React from "react";
import styles from "../Scanner.module.css";
import { Camera, Wallet } from "lucide-react";

interface ScannerActionsProps {
  showAskButton: boolean;
  isLoading: boolean;
  onOpenCamera: () => void;
  onOpenModal: () => void;
  buttonText: string;
}

export const ScannerActions: React.FC<ScannerActionsProps> = ({
  showAskButton,
  isLoading,
  onOpenCamera,
  onOpenModal,
  buttonText,
}) => {
  if (isLoading) {
    return null;
  }

  return (
    <div className={styles.scanButtonContainer}>
      <button
        className={styles.submitButton}
        onClick={showAskButton ? onOpenCamera : onOpenModal}
        disabled={isLoading}
      >
        {showAskButton ? (
          <Camera strokeWidth={1.5} />
        ) : (
          <Wallet strokeWidth={1.5} />
        )}
        {buttonText}
      </button>
    </div>
  );
};