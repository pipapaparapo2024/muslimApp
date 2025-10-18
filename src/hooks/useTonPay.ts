import { useState, useRef } from "react";
import { useTonConnectUI, useTonAddress, CHAIN } from "@tonconnect/ui-react";
import { quranApi } from "../api/api";
import { usePremiumStore } from "../hooks/usePremiumStore";

export interface TonPayParams {
  amount: number;
  type: "premium" | "requests";
  duration?: string | number;
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
  const { fetchUserData } = usePremiumStore();
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inProgressRef = useRef(false);

  const waitForConfirmation = async (
    payload: string,
    maxAttempts = 20
  ): Promise<TonPaymentResponse> => {
    setIsWaitingConfirmation(true);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 Проверка подтверждения (${attempt}/${maxAttempts})`);
        const response = await quranApi.get(
          `/api/v1/payments/ton/${payload}/check`
        );
        const status = response.data.data.orderStatus;

        if (status === "success") {
          await fetchUserData();
          return { status: "success", data: response.data };
        }
        if (["failed", "rejected"].includes(status)) {
          console.warn("❌ Транзакция отклонена сетью");
          return { status: "error", error: "Transaction failed in blockchain" };
        }
        if (status === "pending" && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        if (status === "timeout") {
          return { status: "error", error: "Confirmation timeout" };
        }
      } catch (error) {
        console.error(`⚠️ Ошибка при проверке (${attempt}):`, error);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }
    return { status: "error", error: "Confirmation timeout" };
  };

  const getTonWallet = async () => {
    try {
      if (!userAddress) {
        console.log(
          "🔒 Пользователь не подключён — открываем модальное окно TON Connect"
        );
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }
      const response = await quranApi.get("/api/v1/payments/ton/wallet");
      return response.data.data.wallet;
    } catch (err: any) {
      console.error("TON wallet error:", err);
      return {
        status: err?.message?.includes("Rejected") ? "rejected" : "error",
        error: err,
      };
    }
  };

  const payWithTon = async (
    params: TonPayParams
  ): Promise<TonPaymentResponse> => {
    if (inProgressRef.current) {
      console.warn("⚠️ Оплата уже обрабатывается");
      return { status: "error", error: "Payment already in progress" };
    }

    inProgressRef.current = true;
    setIsProcessing(true);

    try {
      if (!userAddress) {
        console.log("🔒 Открываем модальное окно TON Connect");
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }

      // Проверяем подключение кошелька
      if (!tonConnectUI.connected) {
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }

      const merchantWallet = await getTonWallet();
      if (typeof merchantWallet !== "string") {
        return { status: "error", error: "Merchant wallet not available" };
      }

      // Добавляем валидацию параметров
      if (!params.productId) {
        return { status: "error", error: "Product ID is required" };
      }

      const invoiceResponse = await quranApi.post(
        "/api/v1/payments/ton/invoice",
        {
          priceId: params.productId,
          userWallet: userAddress,
        }
      );

      const { payload, payloadBOC } = invoiceResponse.data.data;
      const amount = params.amount.toString();

      console.log("📦 Данные транзакции:", {
        merchantAddress: merchantWallet,
        amount,
        productId: params.productId,
        userAddress,
      });

      const result = await tonConnectUI.sendTransaction({
        network: CHAIN.MAINNET,
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: merchantWallet,
            amount,
            payload: payloadBOC,
          },
        ],
      });

      console.log("✅ Транзакция отправлена, BOC:", result.boc);
      return await waitForConfirmation(payload);
    } catch (err: any) {
      console.error("TON payment error:", err);

      // Более детальная обработка ошибок
      let status: TonPaymentResponse["status"] = "error";
      if (err?.message?.includes("Rejected")) {
        status = "rejected";
      } else if (err?.message?.includes("Not connected")) {
        status = "not_connected";
      }

      return {
        status,
        error: err?.response?.data || err?.message || err,
      };
    } finally {
      inProgressRef.current = false;
      setIsProcessing(false);
      setIsWaitingConfirmation(false);
    }
  };

  return {
    payWithTon,
    connectedAddress: userAddress,
    isConnected: !!userAddress,
    isWaitingConfirmation,
    isProcessing,
  };
};
