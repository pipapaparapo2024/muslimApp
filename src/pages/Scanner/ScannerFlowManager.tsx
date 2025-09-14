import { useEffect } from "react";
import { useScannerStore } from "../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import { AnalyzingIngredient } from "./analyzingIngredient/AnalyzingIngredient";
import { ProductStatus } from "../../hooks/useScannerStore";

export const ScannerFlowManager: React.FC = () => {
  const { isLoading, error, scanResult, showAnalyzing } = useScannerStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Если есть результат сканирования и загрузка завершена
    if (scanResult && !isLoading) {
      console.log("Scan result received:", scanResult);
      console.log("scanResult.status", scanResult.status);
      console.log("ProductStatus.NEEDS_INFO", ProductStatus.NEEDS_INFO);
      console.log("scanResult.id", scanResult.id);
      
      if (scanResult.status === ProductStatus.NEEDS_INFO) {
        console.log("/scanner/notScanned scanResult.status");
        navigate("/scanner/notScanned");
      } else if (scanResult.id) {
        console.log("/scanner/notScanned scanResult.id");
        sessionStorage.setItem("lastScanId", scanResult.id);
        navigate(`/scanner/historyScanner/${scanResult.id}`);
      }
    }

    // Если есть ошибка и загрузка завершена
    if (error && !isLoading) {
      console.log("Error occurred:", error);
      navigate("/scanner/notScanned");
    }
  }, [scanResult, error, isLoading, navigate]);

  if (isLoading || showAnalyzing) {
    return <AnalyzingIngredient key={Date.now()} />;
  }

  return null;
};
