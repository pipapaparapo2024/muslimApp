import { type ProductStatusType } from '../../hooks/useScannerStore';
import { CircleCheck, CircleX, TriangleAlert, HelpCircle } from 'lucide-react';
import React from 'react';

export const isHaram = (status: ProductStatusType): boolean => {
  return status === "haram";
};

export const isHalal = (status: ProductStatusType): boolean => {
  return status === "halal";
};

export const needsAttention = (status: ProductStatusType): boolean => {
  return status === "warning" || status === "needs_info";
};

export const getStatusTranslationKey = (status: ProductStatusType): string => {
  const translationMap: Record<ProductStatusType, string> = {
    "halal": "halal",
    "haram": "haram",
    "warning": "warning",
    "needs_info": "needsInfo",
    "unknown": "unknown"
  };
  return translationMap[status];
};

export const getStatusIcon = (status: ProductStatusType, size: number = 24): React.ReactElement => {
  switch (status) {
    case "halal":
      return React.createElement(CircleCheck, { size, strokeWidth: 1.5 });
    case "haram":
      return React.createElement(CircleX, { size, strokeWidth: 1.5 });
    case "warning":
      return React.createElement(TriangleAlert, { size, strokeWidth: 1.5 });
    case "needs_info":
      return React.createElement(HelpCircle, { size, strokeWidth: 1.5 });
    default:
      return React.createElement(HelpCircle, { size, strokeWidth: 1.5 });
  }
};

export const getStatusClassName = (status: ProductStatusType, styles: any): string => {
  const classMap: Record<ProductStatusType, string> = {
    "halal": styles.halal,
    "haram": styles.haram,
    "warning": styles.warning,
    "needs_info": styles.needsInfo,
    "unknown": styles.unknown
  };
  return classMap[status] || styles.unknown;
};