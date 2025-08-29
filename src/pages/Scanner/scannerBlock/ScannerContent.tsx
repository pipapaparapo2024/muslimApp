import React from "react";
import styles from "../Scanner.module.css";
import { AnalyzingIngredient } from "../AnalyzingIngredient";
import { HistoryScannerDetail } from "../HistoryScanner/historyScannerDetail/HistoryScannerDetail";
import { Camera, TriangleAlert } from "lucide-react";

interface ScannerContentProps {
  showAnalyzing: boolean;
  scanResult: any;
  capturedImage: string | null;
  onRescan: () => void;
}

export const ScannerContent: React.FC<ScannerContentProps> = ({
  showAnalyzing,
  scanResult,
  capturedImage,
  onRescan,
}) => {
  if (showAnalyzing) {
    return <AnalyzingIngredient />;
  }

  if (scanResult) {
    return <HistoryScannerDetail isScan={true} result={scanResult} />;
  }

  if (capturedImage) {
    return (
      <div className={styles.resultContainer}>
        <div className={styles.resultActions}>
          <button className={styles.rescanButton} onClick={onRescan}>
            <Camera size={16} />
            Scan Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.halalCheck}>
        <span>Instant Halal Check</span>
        <p>
          Take a photo of the product's ingredients to check if it's
          halal or haram. You'll get a quick result with a short
          explanation.
        </p>
        <p className={styles.warning}>
          <TriangleAlert
            strokeWidth={1.5}
            size={18}
            color="white"
            fill="#F59E0B"
          />
          The result is for informational purposes only.
        </p>
      </div>
    </>
  );
};