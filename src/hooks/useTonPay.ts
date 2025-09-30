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

  const waitForConfirmation = async (boc: string, orderId: string, maxAttempts = 20): Promise<TonPaymentResponse> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 Проверка подтверждения (попытка ${attempt}/${maxAttempts})`);
        
        const verificationResponse = await quranApi.post("/api/v1/payments/ton/verify", {
          boc,
          orderId,
          userWallet: userAddress,
          attempt
        });

        const { status, confirmations } = verificationResponse.data;

        if (status === "confirmed") {
          console.log(`✅ Транзакция подтверждена с ${confirmations} подтверждениями`);
          return {
            status: "success",
            data: verificationResponse.data
          };
        }

        if (status === "failed" || status === "rejected") {
          console.log("❌ Транзакция отклонена сетью");
          return {
            status: "error", 
            error: "Transaction failed in blockchain"
          };
        }

        // Если статус "pending" - ждем 3 секунды до следующей проверки
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`⚠️ Ошибка при проверке (попытка ${attempt}):`, error);
        
        // На ошибках сети тоже ждем перед повторной попыткой
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    console.log("⏰ Таймаут ожидания подтверждения");
    return {
      status: "error",
      error: "Confirmation timeout"
    };
  };

  const payWithTon = async (params: TonPayParams): Promise<TonPaymentResponse> => {
    try {
      if (!userAddress) {
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }

      // Создаем заказ (как раньше)
      const invoiceResponse = await quranApi.post("/api/v1/payments/ton/invoice", {
        userWalletAddress: userAddress,
        amount: params.amount,
        type: params.type,
        productId: params.productId,
      });

      const { /*payload*/ boc, merchantWallet, orderId } = invoiceResponse.data;

      // Отправляем транзакцию
      const result = await tonConnectUI.sendTransaction({
        network: CHAIN.TESTNET,
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: merchantWallet,
            amount: (params.amount * 1e9).toString(),
            payload: boc,
          },
        ],
      });

      // 🔄 Ждем подтверждения с polling
      return await waitForConfirmation(result.boc, orderId, 20);

    } catch (err: any) {
      console.error("TON payment error:", err);
      if (err?.message?.includes("Rejected")) {
        return { status: "rejected", error: err };
      }
      return { status: "error", error: err };
    }
  };

  return { payWithTon, connectedAddress: userAddress, isConnected: !!userAddress };
};