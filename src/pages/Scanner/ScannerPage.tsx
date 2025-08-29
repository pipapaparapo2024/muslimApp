import { PageWrapper } from "../../shared/PageWrapper";
import { AnalyzingIngredient } from "./AnalyzingIngredient";
import { HistoryScannerDetail } from "./HistoryScanner/historyScannerDetail/HistoryScannerDetail";
import { NotScaned } from "./NotScaned";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { quranApi } from "../../api/api";
import WebApp from "@twa-dev/sdk";

export const AnalyzePage: React.FC = () => {
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setCapturedImage(null);
    setScanResult(null);

    // Показываем изображение
    const reader = new FileReader();
    reader.onload = () => setCapturedImage(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "ingredients_scan");

      const response = await quranApi.post("/api/v1/scanner/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setScanResult(response.data);
    } catch (error: any) {
      WebApp.showAlert(
        error.response?.data?.message || "Failed to analyze image"
      );
      navigate("/scanner"); // Возврат при ошибке
    } finally {
      setIsAnalyzing(false);
    }

    // Сбросить input
    event.target.value = "";
  };

//   const resetScan = () => {
//     setCapturedImage(null);
//     setScanResult(null);
//     navigate("/scanner"); // Возврат на главную
//   };

  return (
    <PageWrapper showBackButton navigateTo="/scanner">
      <div className="analyze-page">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {isAnalyzing && <AnalyzingIngredient />}
        
        {!isAnalyzing && scanResult && (
          <HistoryScannerDetail isScan={true} result={scanResult} />
        )}
        
        {!isAnalyzing && capturedImage && !scanResult && <NotScaned/>}
        
        {!isAnalyzing && !capturedImage && !scanResult && (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <button onClick={openCamera}>Open Camera</button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};