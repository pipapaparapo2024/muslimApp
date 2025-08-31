import React from "react";
import { Plus, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from './Share.module.css'
import { t } from "i18next";

interface ShareProps {
  shareUrl: string;
  newUrl: string;
  shareText?: string;
  newText?: string;
}

export const Share: React.FC<ShareProps> = ({ 
  shareUrl, 
  newUrl, 
  shareText = t("share"), 
  newText = t("newQuestion") 
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