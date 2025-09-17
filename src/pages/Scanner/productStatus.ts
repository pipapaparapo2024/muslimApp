import { type ProductStatusType } from '../../hooks/useScannerStore';
import { CircleCheck, CircleX, TriangleAlert, HelpCircle } from 'lucide-react';
import React from 'react';


export const getStatusTranslationKey = (status: ProductStatusType): string => {
  const translationMap: Record<ProductStatusType, string> = {
    "halal": "halal",
    "haram": "haram",
    "mushbooh": "mushbooh",
    "needs_info": "needsInfo",
  };
  return translationMap[status];
};

export const getStatusIcon = (status: ProductStatusType, size: number = 24): React.ReactElement => {
  switch (status) {
    case "halal":
      return React.createElement(CircleCheck, { size, color: "color: var(-color-stroke-semantic-brand);", strokeWidth: 1.5 });
    case "haram":
      return React.createElement(CircleX, { size, color: "var(--color-stroke-semantic-error)", strokeWidth: 1.5 });
    case "mushbooh":
      return React.createElement(TriangleAlert, { size, color: " var(--color-background-semantic-solid-warning)", strokeWidth: 1.5 });
    default:
      return React.createElement(HelpCircle, { size, color: "#6B7280", strokeWidth: 1.5 });
  }
};

export const getStatusClassName = (status: ProductStatusType, styles: any): string => {
  const classMap: Record<ProductStatusType, string> = {
    "halal": styles.halal,
    "haram": styles.haram,
    "mushbooh": styles.mushbooh,
    "needs_info": styles.needsInfo,
  };
  return classMap[status] || styles.needsInfo;
};

export const getStatusColor = (status: ProductStatusType): string => {
  const colorMap: Record<ProductStatusType, string> = {
    "halal": " var(-color-stroke-semantic-brand)", 
    "haram": " var(--color-background-semantic-dimmed-error)", 
    "mushbooh": "var(--color-background-semantic-solid-warning)", 
    "needs_info": "#6B7280", 
  };
  return colorMap[status] || "#6B7280";
};