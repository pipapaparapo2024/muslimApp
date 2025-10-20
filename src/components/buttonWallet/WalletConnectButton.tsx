import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import styles from './WalletConnectButton.module.css'
import { useTranslationsStore } from "../../hooks/useTranslations";

export const WalletConnectButton = () => {
    const userAddress = useTonAddress();
    const { translations } = useTranslationsStore()
    const [tonConnectUI] = useTonConnectUI();

    const handleConnect = async () => {
        try {
            await tonConnectUI.openModal();
        } catch (error) {
            console.error("Failed to open wallet modal:", error);
        }
    };

    const handleDisconnect = async () => {
        try {
            await tonConnectUI.disconnect();
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
        }
    };


    return (
        <div
            onClick={userAddress ? handleDisconnect : handleConnect}
            className={styles.walletDisconnect}
        >
            {userAddress ? translations?.disconnect : translations?.connect}
        </div>
    );

};