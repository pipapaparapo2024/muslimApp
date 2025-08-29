import { useEffect } from "react";
import { useScannerStore } from "../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import { AnalyzingIngredient } from "./analyzingIngredient/AnalyzingIngredient";

export const ScannerFlowManager: React.FC = () => {
  const { isLoading, error, scanResult, showAnalyzing } = useScannerStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Если есть результат - переходим на страницу результата
    if (scanResult) {
      // Сохраняем результат в sessionStorage для передачи
      sessionStorage.setItem('lastScanResult', JSON.stringify(scanResult));
      navigate(`/scanner/historyScanner/${scanResult.id}`);
    }
    
    // Если есть ошибка - переходим на страницу ошибки
    if (error && !isLoading) {
      navigate("/scanner/notScanned");
    }
  }, [scanResult, error, isLoading, navigate]);

  // Показываем AnalyzingIngredient во время обработки
  if (showAnalyzing || isLoading) {
    return <AnalyzingIngredient />;
  }

  // Fallback - если что-то пошло не так
  return <div>Something went wrong</div>;
};