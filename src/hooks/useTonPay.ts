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
  fallback?:boolean;
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

  const waitForConfirmation = async (
    payload: string,
    maxAttempts = 20
  ): Promise<TonPaymentResponse> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `🔍 Проверка подтверждения (попытка ${attempt}/${maxAttempts})`
        );
        const response = await quranApi.get(
          `/api/v1/payments/ton/${payload}/check`
        );

        const status = response.data.data.orderStatus;

        if (status === "success") {
          return {
            status: "success",
            data: response.data,
          };
        }

        if (status === "failed" || status === "rejected") {
          console.log("❌ Транзакция отклонена сетью");
          return {
            status: "error",
            error: "Transaction failed in blockchain",
          };
        }

        if (status === "pending") {
          console.log("⏳ Транзакция в обработке, ждем подтверждения...");
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }
        }

        if (status === "timeout") {
          console.log("⏰ Истекло время ожидания подтверждения");
          return {
            status: "error",
            error: "Confirmation timeout",
          };
        }
      } catch (error) {
        console.error(`⚠️ Ошибка при проверке (попытка ${attempt}):`, error);
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    console.log("⏰ Таймаут ожидания подтверждения (maxAttempts)");
    return {
      status: "error",
      error: "Confirmation timeout",
    };
  };

  const getTonWallet = async () => {
    try {
      if (!userAddress) {
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }
      const response = await quranApi.get("/api/v1/payments/ton/wallet");
      console.log("response.data.data.wallet", response.data.data.wallet);
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
      if (!userAddress) {
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }

      const merchantWallet = await getTonWallet();

      const invoiceResponse = await quranApi.post(
        "/api/v1/payments/ton/invoice",
        {
          priceId: params.productId,
          userWallet: userAddress,
        }
      );

      const { payload, payloadBOC } = invoiceResponse.data.data;
      const amountNano = Math.floor(params.amount).toString();

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

      try {
        // ✅ 1. Пробуем нативное окно TonConnect
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log("✅ TON transaction sent", result);
        return await waitForConfirmation(payload);
      } catch (err: any) {
        console.warn("⚠️ sendTransaction failed, fallback to deep link:", err);

        // 🐤 Если ошибка типа TonConnectUIError — используем fallback
        if (
          err.name === "TonConnectUIError" ||
          err.message?.includes("TonConnectUIError")
        ) {
          const deepLink = `https://t.me/wallet/startapp?startapp=tonconnect&transaction=${encodeURIComponent(
            JSON.stringify(transaction)
          )}`;
          window.Telegram?.WebApp?.openTelegramLink(deepLink);
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
