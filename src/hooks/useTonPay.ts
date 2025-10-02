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
  status: "success" | "rejected" | "not_connected" | "server_error" | "error";
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

        const responce = await quranApi.get(
          `/api/v1/payments/ton/${payload}/check`
        );

        const  status  = responce.data.data.orderStatus;

        if (status === "success") {
          return {
            status: "success",
            data: responce.data,
          };
        }

        if (status === "failed" || status === "rejected") {
          console.log("❌ Транзакция отклонена сетью");
          return {
            status: "error",
            error: "Transaction failed in blockchain",
          };
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`⚠️ Ошибка при проверке (попытка ${attempt}):`, error);
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    console.log("⏰ Таймаут ожидания подтверждения");
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

      const payload = invoiceResponse.data.data.payload;
      const merchantAddress = merchantWallet; // Адрес мерчанта
      const amount = (params.amount * 1e9).toString(); // Сумма в нанотонах

      console.log("📦 Данные транзакции:", {
        merchantAddress,
        amount,
        hasPayload: !!payload,
      });

      const result = await tonConnectUI.sendTransaction({
        network: CHAIN.TESTNET,
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: merchantAddress,
            amount: amount,
            payload: payload,
          },
        ],
      });

      console.log("✅ Транзакция отправлена, BOC:", result.boc);

      // Ждем подтверждения
      return await waitForConfirmation(result.boc, payload);
    } catch (err: any) {
      console.error("TON payment error:", err);
      if (err?.message?.includes("Rejected")) {
        return { status: "rejected", error: err };
      }
      return { status: "error", error: err };
    }
  };

  return {
    payWithTon,
    connectedAddress: userAddress,
    isConnected: !!userAddress,
  };
};
