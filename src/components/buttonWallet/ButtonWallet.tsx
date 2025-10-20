import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";

export const WalletConnectButton = () => {
  const userAddress = useTonAddress();
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

  // Форматируем адрес для отображения
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (userAddress) {
    return (
      <div className="wallet-connected">
        <span className="wallet-address">
          {formatAddress(userAddress)}
        </span>
        <button 
          onClick={handleDisconnect}
          className="wallet-disconnect-btn"
          type="button"
        >
          Отключить
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleConnect}
      className="wallet-connect-btn"
      type="button"
    >
      Подключить кошелек
    </button>
  );
};