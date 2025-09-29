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

  const payWithTon = async (params: TonPayParams): Promise<TonPaymentResponse> => {
    try {
      if (!userAddress) {
        console.log("Wallet not connected, opening modal...");
        await tonConnectUI.openModal();
        return { status: "not_connected" };
      }

      // Получаем адрес кошелька для оплаты
      const response = await quranApi.get<{ data: { wallet: string } }>(
        "/api/ton-config"
      );
      const address = response.data.data.wallet;

      if (!address) {
        return { status: "server_error" };
      }

      // Создать заказ на сервере
      const invoiceResponse = await quranApi.post<{ payload: string; boc: string }>(
        "/bot/create-invoice-ton",
        {
          walletAddress: address,
          amount: params.amount,
          type: params.type,
          duration: params.duration,
          quantity: params.quantity,
          productId: params.productId,
          wallet: userAddress,
        }
      );

      const { payload, boc } = invoiceResponse.data;

      if (!boc) {
        return { status: "server_error" };
      }

      // Отправляем транзакцию
      const result = await tonConnectUI.sendTransaction({
        network: CHAIN.TESTNET,
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: address,
            amount: (params.amount * 1e9).toString(),
            payload: boc,
          },
        ],
      });

      // Верифицируем транзакцию на сервере
      const verificationResponse = await quranApi.post("/bot/verify-ton-boc", {
        boc: result.boc,
        payload,
      });

      return {
        status: "success",
        data: verificationResponse,
      };
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