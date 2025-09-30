import { useState, useEffect } from "react";
import { quranApi } from "../api/api";

export interface PriceCurrency {
  id: string;
  priceAmount: number;
  priceType: string;
}

export interface PriceItem {
  id: string;
  revardAmount: number;
  revardType: string;
  title: string;
  currency: PriceCurrency[];
}

export interface PricesResponse {
  data: {
    prices: PriceItem[];
  };
  status: string;
}

export type ProductType = "premium" | "requests";

export const usePrices = () => {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await quranApi.get<PricesResponse>(
        "/api/v1/payments/prices/"
      );
      if (response.data?.data?.prices) {
        setPrices(response.data.data.prices);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error fetching prices:", err);
      setError(err.message || "Failed to fetch prices");
    } finally {
      setLoading(false);
    }
  };

  // Получить цену по типу продукта и валюте
  const getPrice = (
    productType: ProductType,
    currencyType: string = "TON"
  ): PriceCurrency | null => {
    const product = prices.find(
      (item) => item.revardType.toLowerCase() === productType.toLowerCase()
    );
    if (!product) return null;

    const currency = product.currency.find(
      (curr) => curr.priceType.toUpperCase() === currencyType.toUpperCase()
    );
    return currency ? currency : null;
  };

  // Получить количество (для requests) или длительность (для premium)
  const getProductDetails = (productType: ProductType) => {
    const product = prices.find(
      (item) => item.revardType.toLowerCase() === productType.toLowerCase()
    );

    if (!product) return null;
    return {
      id: product.id,
      amount: product.revardAmount,
      type: product.revardType,
      title: product.title,
      currencies: product.currency,
    };
  };

  // Получить все продукты определенного типа
  const getProductsByType = (productType: ProductType): PriceItem[] => {
    return prices.filter(
      (item) => item.revardType.toLowerCase() === productType.toLowerCase()
    );
  };

  useEffect(() => {
    fetchPrices();
  }, []);
  // В хук usePrices добавляем новую функцию
  const getPriceByProductId = (
    productId: string,
    currencyType: string = "TON"
  ): PriceCurrency | null => {
    const product = prices.find((item) => item.id === productId);
    console.log("getPriceByProductId - searching for:", {
      productId,
      currencyType,
      foundProduct: product,
    });
    if (!product) return null;

    const currency = product.currency.find(
      (curr) => curr.priceType.toUpperCase() === currencyType.toUpperCase()
    );
    return currency ? currency : null;
  };

  // Возвращаем в usePrices
  return {
    prices,
    loading,
    error,
    fetchPrices,
    getPrice,
    getPriceByProductId, 
    getProductDetails,
    getProductsByType,
  };
};
