// import { useEffect } from "react";
// import { useScannerStore } from "../../hooks/useScannerStore";
// import { useNavigate } from "react-router-dom";
// import { AnalyzingIngredient } from "./analyzingIngredient/AnalyzingIngredient";

// export const ScannerFlowManager: React.FC = () => {
//   const { isLoading, error, scanResult, showAnalyzing } = useScannerStore();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (scanResult) {
//       sessionStorage.setItem('lastScanResult', JSON.stringify(scanResult));
//       navigate(`/scanner/historyScanner/${scanResult.id}`);
//     }
    
//     // Если есть ошибка - переходим на страницу ошибки
//     if (error && !isLoading) {
//       navigate("/scanner/notScanned");
//     }
//   }, [scanResult, error, isLoading, navigate]);

//   if (showAnalyzing || isLoading) {
//     return <AnalyzingIngredient />;
//   }

//   return <div>Something went wrong</div>;
// };