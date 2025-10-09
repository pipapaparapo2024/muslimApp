import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { CHAIN } from "@tonconnect/ui-react";
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
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  // ✅ ждём, пока Telegram Mini App будет готов
  const waitForTelegramReady = async () => {
    return new Promise<void>((resolve) => {
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
        console.log(`🔍 Проверка подтверждения (${attempt}/${maxAttempts})`);
        const response = await quranApi.get(
          `/api/v1/payments/ton/${payload}/check`
        );

        const status = response.data.data.orderStatus;

        if (status === "success") {
          return { status: "success", data: response.data };
        }

        if (status === "failed" || status === "rejected") {
          return { status: "error", error: "Transaction failed in blockchain" };
        }

        if (status === "pending" && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
      } catch (error) {
        console.error(`⚠️ Ошибка проверки (${attempt}):`, error);
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 3000));
      }
    }

    return { status: "error", error: "Confirmation timeout" };
  };

  const getTonWallet = async () => {
    try {
      if (!userAddress) {
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }
      const response = await quranApi.get("/api/v1/payments/ton/wallet");
      return response.data.data.wallet;
    } catch (err: any) {
      console.error("TON wallet error:", err);
      if (err?.message?.includes("Rejected")) {
        return { status: "rejected", error: err };
      }
      return { status: "error", error: err };
    }
  };

  const payWithTon = async (
    params: TonPayParams
  ): Promise<TonPaymentResponse> => {
    try {
      // ✅ 1. Ждём Telegram.ready перед началом
      await waitForTelegramReady();

      // ✅ 2. Проверяем подключение кошелька
      if (!userAddress) {
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }

      const merchantWallet = await getTonWallet();

      // Создаём инвойс
      const invoiceResponse = await quranApi.post(
        "/api/v1/payments/ton/invoice",
        {
          priceId: params.productId,
          userWallet: userAddress,
        }
      );

      const { payload, payloadBOC } = invoiceResponse.data.data;
      const amountNano = Math.floor(params.amount * 1e9).toString();

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

      // ✅ 3. Добавляем небольшую задержку — Android WebView стабилизируется
      await new Promise((r) => setTimeout(r, 400));

      // ✅ 4. Пробуем нативное окно TonConnect
      try {
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log("✅ TON transaction sent", result);
        return await waitForConfirmation(payload);
      } catch (err: any) {
        console.warn("⚠️ sendTransaction failed:", err);

        // ✅ 5. Если ошибка TonConnectUIError — делаем повтор
        if (
          err.name === "TonConnectUIError" ||
          err.message?.includes("TonConnectUIError")
        ) {
          console.log("🔄 Повторная попытка TonConnect после ошибки...");
          await new Promise((r) => setTimeout(r, 700)); // короткий retry delay
          try {
            const retry = await tonConnectUI.sendTransaction(transaction);
            console.log("✅ Успешно после повторной попытки:", retry);
            return await waitForConfirmation(payload);
          } catch (retryErr) {
            console.warn("⚠️ Retry тоже не сработал, fallback → Telegram Wallet");
          }
        }

        // ✅ 6. Fallback через Telegram Wallet deep link
        if (window.Telegram?.WebApp) {
          const deepLink = `https://t.me/wallet/startapp?startapp=tonconnect&transaction=${encodeURIComponent(
            JSON.stringify(transaction)
          )}`;
          window.Telegram.WebApp.openTelegramLink(deepLink);
          return { status: "pending", fallback: true };
        }

        throw err;
      }
    } catch (err) {
      console.error("TON payment fatal error:", err);
      return { status: "error", error: err };
    }
  };

  return {
    payWithTon,
    connectedAddress: userAddress,
    isConnected: !!userAddress,
  };
};
