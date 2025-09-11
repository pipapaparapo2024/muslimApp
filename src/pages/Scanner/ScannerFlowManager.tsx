import { useEffect } from "react";
import { useScannerStore } from "../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import { AnalyzingIngredient } from "./analyzingIngredient/AnalyzingIngredient";

export const ScannerFlowManager: React.FC = () => {
  const { isLoading, error, scanResult, showAnalyzing } = useScannerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (scanResult && scanResult.id) {
      // Сохраняем только ID, детали будем получать из API
      sessionStorage.setItem('lastScanId', scanResult.id);
      navigate(`/scanner/historyScanner/${scanResult.id}`);
    }
    
    if (error && !isLoading) {
      navigate("/scanner/notScanned");
    }
  }, [scanResult, error, isLoading, navigate]);

  if (showAnalyzing || isLoading) {
    return <AnalyzingIngredient />;
  }

  return null;
};