import React from "react";
import { PageWrapper } from "../../../../shared/PageWrapper";
import styles from "./ContactUs.module.css";
import { MessageCircle } from "lucide-react";
import { useTranslationsStore } from "../../../../hooks/useTranslations";
const BOT_USERNAME = "QiblaGuidebot";

export const ContactUs: React.FC = () => {
  const { translations } = useTranslationsStore();

  const openBotChat = () => {
    const tg = window.Telegram?.WebApp;

    const botUrl = `https://t.me/${BOT_USERNAME}`;

    try {
      if (tg) {
        tg.openTelegramLink(botUrl);
      } else {
        window.open(botUrl, "_blank");
      }
    } catch (err) {
      console.error("Error opening Telegram bot:", err);
      window.open(botUrl, "_blank");
    }
  };

  return (
    <PageWrapper showBackButton navigateTo="/settings">
      <div className={styles.contactContainer}>
        <div className={styles.title}>{translations?.contactUs}</div>
        <div className={styles.text}>{translations?.needHelp}</div>

        <button onClick={openBotChat} className={styles.contactButton}>
          <MessageCircle size={20} strokeWidth={1.5} />
          {translations?.chatWithSupport}
        </button>
      </div>
    </PageWrapper>
  );
};
