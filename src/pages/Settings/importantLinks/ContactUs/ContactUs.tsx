import React from "react";
import { PageWrapper } from "../../../../shared/PageWrapper";
import styles from "./ContactUs.module.css";
import { MessageCircle } from "lucide-react";

const BOT_USERNAME = "@QiblaGuidebot"; 

export const ContactUs: React.FC = () => {
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
    <PageWrapper showBackButton  navigateTo="/settings">
      <div className={styles.contactContainer}>
        <h2 className={styles.title}>Contact Us</h2>
        <p className={styles.text}>
          Need help or want to reach our team? Message us directly in Telegram!
        </p>

        <button onClick={openBotChat} className={styles.contactButton}>
          <MessageCircle size={18} className="mr-2" />
          Chat with Support
        </button>
      </div>
    </PageWrapper>
  );
};
