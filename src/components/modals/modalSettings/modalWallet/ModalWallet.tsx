import React from "react";
import styles from "./ModalWallet.module.css"
import { useTranslationsStore } from "../../../../hooks/useTranslations";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";

interface WalletModalProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const ModalWallet: React.FC<WalletModalProps> = ({
    isOpen,
    onClose,
}) => {
    const userAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const { translations } = useTranslationsStore();
    console.log("ModalWallet render - isOpen:", isOpen);
    const handleConnect = async () => {
        try {
            await tonConnectUI.openModal();
            onClose?.();
        } catch (error) {
            console.error("Failed to open wallet modal:", error);
        }
    };

    const handleDisconnect = async () => {
        try {
            await tonConnectUI.disconnect();
            onClose?.();
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
        }
    };
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{translations?.wallet}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div
                    onClick={userAddress ? handleDisconnect : handleConnect}
                    className={styles.walletDisconnect}
                >
                    {userAddress ? translations?.disconnect : translations?.connect}
                </div>
            </div>
        </div>
    );
};
