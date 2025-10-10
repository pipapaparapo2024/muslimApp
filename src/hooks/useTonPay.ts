import { TonConnect, CHAIN } from "@tonconnect/sdk";
import { quranApi } from "../api/api";

export interface TonPayParams {
  amount: number;
  type: "premium" | "requests";
  duration?: string;
  quantity?: number;
  productId?: string;
}

export interface TonPaymentResponse {
  fallback?: boolean;
  status:
    | "success"
    | "rejected"
    | "not_connected"
    | "server_error"
    | "error"
    | "pending";
  error?: any;
  data?: any;
}

export const useTonPay = () => {
  const tonConnect = new TonConnect({
    manifestUrl: "https://islamapp.myfavouritegames.org/tonconnect-manifest.json",
  });

  const waitForTelegramReady = async (): Promise<void> => {
    return new Promise((resolve) => {
      if (window.Telegram?.WebApp?.initData) {
        window.Telegram.WebApp.ready?.();
        resolve();
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          window.Telegram?.WebApp?.ready?.();
          resolve();
        });
      }
    });
  };

  const waitForConfirmation = async (
    payload: string,
    maxAttempts = 20
  ): Promise<TonPaymentResponse> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await quranApi.get(`/api/v1/payments/ton/${payload}/check`);
        const status = response.data.data.orderStatus;

        if (status === "success") return { status: "success", data: response.data };
        if (status === "failed" || status === "rejected")
          return { status: "error", error: "Transaction failed in blockchain" };

        await new Promise((r) => setTimeout(r, 3000));
      } catch {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    return { status: "error", error: "Confirmation timeout" };
  };

  const getTonWallet = async (): Promise<string> => {
    const response = await quranApi.get("/api/v1/payments/ton/wallet");
    return response.data.data.wallet;
  };

  const payWithTon = async (params: TonPayParams): Promise<TonPaymentResponse> => {
    try {
      await waitForTelegramReady();
      await new Promise((r) => setTimeout(r, 500));

      const account = tonConnect.account;

      // Если кошелёк не подключён — запрашиваем соединение
      if (!account) {
        console.warn("❌ Кошелёк не подключён — вызываем connect()");
        await tonConnect.connect({
          universalLink: "https://app.tonkeeper.com/ton-connect",
          bridgeUrl: "https://bridge.tonapi.io/bridge",
        });
        return { status: "not_connected" };
      }

      const userAddress = account.address;
      const merchantWallet = await getTonWallet();

      // Создаём инвойс
      const invoiceResponse = await quranApi.post("/api/v1/payments/ton/invoice", {
        priceId: params.productId,
        userWallet: userAddress,
      });

      const { payload, payloadBOC } = invoiceResponse.data.data;
      const amountNano = Math.floor(params.amount * 1e9).toString();

      // Формируем транзакцию
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        network: CHAIN.MAINNET,
        messages: [
          {
            address: merchantWallet,
            amount: amountNano,
            payload: payloadBOC,
          },
        ],
      };

      const result = await tonConnect.sendTransaction(transaction);
      console.log("✅ Транзакция отправлена:", result);

      return await waitForConfirmation(payload);
    } catch (err) {
      console.error("💥 TON critical error:", err);

      // Fallback через Telegram Wallet deep link
      if (window.Telegram?.WebApp) {
        const deepLink = `https://t.me/wallet/startapp?startapp=tonconnect&transaction=${encodeURIComponent(
          JSON.stringify(err)
        )}`;
        window.Telegram.WebApp.openTelegramLink(deepLink);
        return { status: "pending", fallback: true };
      }

      return { status: "error", error: err };
    }
  };

  return {
    payWithTon,
    connectedAddress: tonConnect.account?.address || null,
    isConnected: !!tonConnect.account,
  };
};
