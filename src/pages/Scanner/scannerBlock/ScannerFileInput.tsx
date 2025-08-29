import React, { useRef } from "react";

interface ScannerFileInputProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ScannerFileInput: React.FC<ScannerFileInputProps> = ({
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <input
      type="file"
      ref={fileInputRef}
      accept="image/*"
      capture="environment"
      onChange={onFileSelect}
      style={{ display: "none" }}
    />
  );
};