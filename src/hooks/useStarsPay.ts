import { quranApi } from "../api/api";

export interface StarsPayParams {
  amount: number;
  type: "premium" | "requests";
  duration?: string;
  quantity?: number;
  productId?: string;
}

export interface StarsPaymentResponse {
  status: "success" | "error" | "insufficient_funds";
  paymentUrl?: string;
  error?: string;
}

export const useStarsPay = () => {
  const payWithStars = async (params: StarsPayParams): Promise<StarsPaymentResponse> => {
    try {
      const response = await quranApi.post<{ data: { payment_url: string } }>(
        "/stars/invoice",
        {
          amount: params.amount,
          type: params.type,
          duration: params.duration,
          quantity: params.quantity,
          productId: params.productId,
        }
      );

      if (response.data.data.payment_url) {
        // Открываем ссылку на оплату в новом окне
        window.open(response.data.data.payment_url, '_blank');
        
        return {
          status: "success",
          paymentUrl: response.data.data.payment_url
        };
      }

      return {
        status: "error",
        error: "Payment URL not received"
      };
    } catch (error: any) {
      console.error("Stars payment error:", error);
      
      // Проверяем, если ошибка из-за недостатка средств
      if (error.response?.data?.error?.includes('insufficient')) {
        return {
          status: "insufficient_funds",
          error: "Insufficient stars balance"
        };
      }

      return {
        status: "error",
        error: error.response?.data?.error || "Payment failed"
      };
    }
  };

  return {
    payWithStars
  };
};