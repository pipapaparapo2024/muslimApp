import { quranApi } from "../api/api";

export interface StarsPayParams {
  productId?: string;
  currencyId?: string;
}

export interface StarsPaymentResponse {
  status: "success" | "error" | "insufficient_funds";
  paymentUrl?: string;
  invoiceUrl?: string;
  error?: string;
}

export const useStarsPay = () => {
  const payWithStars = async (
    params: StarsPayParams
  ): Promise<StarsPaymentResponse> => {
    try {
      // Создаем инвойс для оплаты Stars
      const response = await quranApi.post("/stars/invoice", {
        currencyId: params.currencyId, 
      });

      if (response.data.data.url) {
        if (window.Telegram?.WebApp) {
          try {
            window.Telegram.WebApp.openInvoice(
              response.data.data.url,
              (status: string) => {
                // Обработка результата оплаты
                if (status === "paid") {
                  console.log("Payment successful");
                  // Можно добавить дополнительную логику здесь
                } else if (status === "failed") {
                  console.log("Payment failed");
                } else if (status === "cancelled") {
                  console.log("Payment cancelled");
                }
              }
            );

            return {
              status: "success",
              invoiceUrl: response.data.data.url,
            };
          } catch (telegramError) {
            console.error("Telegram WebApp error:", telegramError);
            window.open(response.data.data.url, "_blank");
          }
        } else {
          // Fallback для браузера
          window.open(response.data.data.url, "_blank");
        }

        return {
          status: "success",
          invoiceUrl: response.data.data.url,
        };
      }

      return {
        status: "error",
        error: "Invoice URL not received",
      };
    } catch (error: any) {
      console.error("Stars payment error:", error);

      // Проверяем, если ошибка из-за недостатка средств
      if (error.response?.data?.error?.includes("insufficient")) {
        return {
          status: "insufficient_funds",
          error: "Insufficient stars balance",
        };
      }

      return {
        status: "error",
        error: error.response?.data?.error || "Payment failed",
      };
    }
  };

  return {
    payWithStars,
  };
};
