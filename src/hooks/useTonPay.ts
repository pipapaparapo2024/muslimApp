import { useTonConnectUI, useTonAddress, CHAIN } from "@tonconnect/ui-react";
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

  /**
   * ✅ Ждём, пока Telegram Mini App будет полностью готов.
   */
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

  /**
   * 🔁 Проверка подтверждения транзакции на бэке
   */
  const waitForConfirmation = async (
    payload: string,
    maxAttempts = 20
  ): Promise<TonPaymentResponse> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 Проверка TON оплаты (${attempt}/${maxAttempts})`);
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

        await new Promise((r) => setTimeout(r, 3000));
      } catch (err) {
        console.error("⚠️ Ошибка проверки транзакции:", err);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    return { status: "error", error: "Confirmation timeout" };
  };

  /**
   * 💼 Получаем TON-кошелёк мерчанта
   */
  const getTonWallet = async (): Promise<string> => {
    const response = await quranApi.get("/api/v1/payments/ton/wallet");
    return response.data.data.wallet;
  };

  /**
   * 💳 Основной процесс оплаты TON
   */
  const payWithTon = async (
    params: TonPayParams
  ): Promise<TonPaymentResponse> => {
    try {
      console.log("💎 TON оплата запущена...", params);

      // 1️⃣ Проверяем Telegram.ready
      await waitForTelegramReady();
      await new Promise((r) => setTimeout(r, 500));

      // 2️⃣ Проверяем подключение кошелька
      if (!userAddress) {
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }

      // 3️⃣ Получаем адрес кошелька мерчанта
      const merchantWallet = await getTonWallet();

      // 4️⃣ Создаём инвойс
      const invoiceResponse = await quranApi.post(
        "/api/v1/payments/ton/invoice",
        {
          priceId: params.productId,
          userWallet: userAddress,
        }
      );

      const { payload, payloadBOC } = invoiceResponse.data.data;
      const amountNano = Math.floor(params.amount * 1e9).toString();

      // 5️⃣ Формируем транзакцию
      // const transaction = {
      //   validUntil: Math.floor(Date.now() / 1000) + 300,
      //   network: CHAIN.MAINNET,
      //   messages: [
      //     {
      //       address: merchantWallet,
      //       amount: amountNano,
      //       payload: payloadBOC,
      //     },
      //   ],
      // };
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        network: CHAIN.MAINNET,
        messages: [
          {
            address: merchantWallet,
            amount: String(amountNano), // обязательно строка!
            payload: payloadBOC ? btoa(payloadBOC) : undefined, // перекодировка в base64
          },
        ],
      };

      // 6️⃣ Небольшая пауза — Telegram WebView стабилизируется
      await new Promise((r) => setTimeout(r, 700));

      /**
       * 7️⃣ Попытка через нативное окно TonConnect
       */
      try {
        console.log("🚀 Отправляем через TonConnect...");
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log("✅ Транзакция отправлена:", result);
        return await waitForConfirmation(payload);
      } catch (err: any) {
        console.warn("⚠️ Ошибка TonConnectUI:", err);

        // Retry один раз
        if (
          err.name === "TonConnectUIError" ||
          err.message?.includes("TonConnectUIError")
        ) {
          console.log("🔁 Повторная попытка через 1 сек...");
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const retry = await tonConnectUI.sendTransaction(transaction);
            console.log("✅ Повтор успешен:", retry);
            return await waitForConfirmation(payload);
          } catch (retryErr) {
            console.warn("❌ Повтор TonConnect не удался:", retryErr);
          }
        }

        /**
         * 8️⃣ Fallback — Telegram Wallet deep link
         */
        if (window.Telegram?.WebApp) {
          console.log("🌐 Fallback через Telegram Wallet deep link...");
          const deepLink = `https://t.me/wallet/startapp?startapp=tonconnect&transaction=${encodeURIComponent(
            JSON.stringify(transaction)
          )}`;
          window.Telegram.WebApp.openTelegramLink(deepLink);
          return { status: "pending", fallback: true };
        }

        return { status: "error", error: err };
      }
    } catch (err) {
      console.error("💥 TON critical error:", err);
      return { status: "error", error: err };
    }
  };

  return {
    payWithTon,
    connectedAddress: userAddress,
    isConnected: !!userAddress,
  };
};
