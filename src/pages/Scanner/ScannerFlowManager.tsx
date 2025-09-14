import { useEffect } from "react";
import { useScannerStore } from "../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import { AnalyzingIngredient } from "./analyzingIngredient/AnalyzingIngredient";
import { ProductStatus } from "../../hooks/useScannerStore";

export const ScannerFlowManager: React.FC = () => {
  const { isLoading, error, scanResult, showAnalyzing } = useScannerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (scanResult) {
      if (scanResult.status === ProductStatus.NEEDS_INFO) {
        // Для needs_info показываем специальную страницу
        
        navigate("/scanner/notScanned");
      } else if (scanResult.id) {
        // Для других статусов переходим к результатам
        sessionStorage.setItem('lastScanId', scanResult.id);
        console.log(`/scanner/historyScanner/${scanResult.id}`)
        navigate(`/scanner/historyScanner/${scanResult.id}`);
      }
    }
    
    if (error && !isLoading) {
      navigate("/scanner/notScanned");
    }
  }, [scanResult, error, isLoading, navigate]);

  if (showAnalyzing || isLoading) {
    return <AnalyzingIngredient key={Date.now()}/>;
  }

  return null;
};