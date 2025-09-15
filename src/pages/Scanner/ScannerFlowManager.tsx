import { useEffect } from "react";
import { AnalyzingIngredient } from "./analyzingIngredient/AnalyzingIngredient";
import { useNavigate } from "react-router-dom";
import { ProductStatus, useScannerStore } from "../../hooks/useScannerStore";

export const ScannerFlowManager: React.FC = () => {
  const { isLoading, error, scanResult, showAnalyzing } = useScannerStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Если есть результат сканирования и загрузка завершена
    if (scanResult && !isLoading) {
      if (scanResult.data.engType === ProductStatus.NEEDS_INFO) {
        navigate("/scanner/notScanned");
      } else if (scanResult.id) {
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

  // В ScannerFlowManager
  if (isLoading || showAnalyzing) {
    return <AnalyzingIngredient key={isLoading ? "loading" : "analyzing"} />;
  }
  return null;
};
