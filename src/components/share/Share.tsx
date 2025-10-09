import React from "react";
import { Plus, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./Share.module.css";
import { trackButtonClick } from "../../api/analytics";

interface ShareProps {
  shareUrl: string;
  newUrl: string;
  shareText?: string;
  newText?: string | undefined;
}

export const Share: React.FC<ShareProps> = ({
  shareUrl,
  newUrl,
  shareText = "Share",
  newText = "New Question",
}) => {
  const navigate = useNavigate();

  const handleShare = () => {
    navigate(shareUrl);
  };

  const handleNew = () => {
    if (newUrl == "/qna") trackButtonClick("qa", "click_new_question");
    else trackButtonClick("food_scan", "click_new_scan");
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
