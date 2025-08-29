// Share.tsx
import React from "react";
import { Plus, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from './Share.module.css'

interface ShareProps {
  shareUrl: string;
  newUrl: string;
  shareText?: string;
  newText?: string;
}

export const Share: React.FC<ShareProps> = ({ 
  shareUrl, 
  newUrl, 
  shareText = "Share", 
  newText = "New Question" 
}) => {
  const navigate = useNavigate();

  const handleShare = () => {
    navigate(shareUrl);
  };

  const handleNew = () => {
    navigate(newUrl);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
      <button
        type="button"
        className={styles.submitButton}
        onClick={handleShare}
      >
        <Upload strokeWidth={1.5} /> {shareText}
      </button>
      <button
        type="button"
        className={styles.questionButton}
        onClick={handleNew}
      >
        <Plus strokeWidth={1.5} /> {newText}
      </button>
    </form>
  );
};