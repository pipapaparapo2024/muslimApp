import { useState, useRef, useEffect } from "react";
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

  const isTonConnectReady = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      isTonConnectReady.current = true;
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
          console.log("✅ Транзакция подтверждена");
          await fetchUserData();
          return { status: "success", data: response.data };
        }

        if (["failed", "rejected"].includes(status)) {
          console.warn("❌ Транзакция отклонена сетью");
          return { status: "error", error: "Transaction failed in blockchain" };
        }

        if (status === "pending") {
          if (attempt < maxAttempts) {
            // Увеличиваем интервал между проверками
            await new Promise((r) => setTimeout(r, 4000));
            continue;
          } else {
            return { status: "error", error: "Confirmation timeout" };
          }
        }

        if (status === "timeout") {
          return { status: "error", error: "Confirmation timeout" };
        }
      } catch (error) {
        console.error(`⚠️ Ошибка при проверке (${attempt}):`, error);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 4000));
        }
      }
    }

    return { status: "error", error: "Confirmation timeout" };
  };

  const getTonWallet = async (): Promise<string | TonPaymentResponse> => {
    try {
      // Проверяем готовность TON Connect
      if (!isTonConnectReady.current) {
        console.log("⏳ TON Connect еще не готов");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!userAddress || !tonConnectUI.connected) {
        console.log(
          "🔒 Пользователь не подключён — открываем модальное окно TON Connect"
        );
        await tonConnectUI.openModal();

        // Ждем подключения
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!userAddress) {
          return { status: "not_connected", error: "User not connected" };
        }
      }

      const response = await quranApi.get("/api/v1/payments/ton/wallet");

      if (!response.data.data?.wallet) {
        throw new Error("Wallet not found in response");
      }

      return response.data.data.wallet;
    } catch (err: any) {
      console.error("TON wallet error:", err);

      // Более детальная обработка ошибок
      if (err?.response?.status === 400) {
        return { status: "server_error", error: "Server configuration error" };
      }

      if (err?.message?.includes("Rejected") || err?.code === "USER_REJECTED") {
        return { status: "rejected", error: err };
      }

      if (err?.message?.includes("Not connected") || !userAddress) {
        return { status: "not_connected", error: err };
      }

      return { status: "error", error: err };
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
      console.log("🚀 Начинаем процесс оплаты TON");

      // Проверяем подключение
      console.log("Проверяем подключение");
      console.log("userAddress", userAddress);
      console.log("!tonConnectUI.connected", !tonConnectUI.connected);
      if (!userAddress || !tonConnectUI.connected) {
        console.log("🔒 Открываем модальное окно TON Connect");
        await tonConnectUI.openModal();

        // Ждем 3 секунды для подключения
        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (!userAddress) {
          return { status: "not_connected", error: "Wallet not connected" };
        }
      }

      // Получаем кошелек мерчанта
      const merchantWalletResult = await getTonWallet();

      if (typeof merchantWalletResult !== "string") {
        return merchantWalletResult;
      }

      // Валидация параметров
      if (!params.productId) {
        return { status: "error", error: "Product ID is required" };
      }

      console.log("📦 Создаем инвойс для продукта:", params.productId);

      // Создаем инвойс
      const invoiceResponse = await quranApi.post(
        "/api/v1/payments/ton/invoice",
        {
          priceId: params.productId,
          userWallet: userAddress,
        }
      );

      if (!invoiceResponse.data.data?.payload) {
        throw new Error("Invalid invoice response");
      }

      const { payload, payloadBOC } = invoiceResponse.data.data;
      const amount = params.amount.toString();

      console.log("📦 Данные транзакции:", {
        merchantAddress: merchantWalletResult,
        amount,
        productId: params.productId,
        userAddress,
        payload,
      });
      // Отправляем транзакцию
      console.log("🔄 Отправляем транзакцию в блокчейн...");
      console.log("🔍 Merchant wallet:", merchantWalletResult);
      console.log("💰 Amount in nanoTON:", amount);
      console.log("payloadBOC", payloadBOC);
      console.log("---------------------------------------------");
      console.log("данные которые передаются в sendTransaction", {
        network: CHAIN.MAINNET,
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: merchantWalletResult,
            amount,
            payload: payloadBOC,
          },
        ],
      });
      const result = await tonConnectUI.sendTransaction({
        network: CHAIN.MAINNET,
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: merchantWalletResult,
            amount,
            payload: payloadBOC,
          },
        ],
      });

      console.log("✅ Транзакция отправлена, BOC:", result.boc);

      // Ждем подтверждения
      return await waitForConfirmation(payload);
    } catch (err: any) {
      console.error("❌ TON payment error:", err);

      // Детальная обработка различных ошибок
      let status: TonPaymentResponse["status"] = "error";
      let errorMessage = err?.message || "Unknown error";

      if (err?.message?.includes("Rejected") || err?.code === "USER_REJECTED") {
        status = "rejected";
        errorMessage = "Transaction rejected by user";
      } else if (err?.message?.includes("Not connected") || !userAddress) {
        status = "not_connected";
        errorMessage = "Wallet not connected";
      } else if (err?.response?.status === 400) {
        status = "server_error";
        errorMessage = "Server configuration error";
      } else if (err?.message?.includes("Network")) {
        status = "error";
        errorMessage = "Network error, please check connection";
      }

      return {
        status,
        error: {
          message: errorMessage,
          details: err?.response?.data || err,
          code: err?.code,
        },
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
    isConnected: !!userAddress && tonConnectUI.connected,
    isWaitingConfirmation,
    isProcessing,
  };
};
