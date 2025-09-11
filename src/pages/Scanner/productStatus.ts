import { ProductStatus } from '../../hooks/useScannerStore';
import { CircleCheck, CircleX, TriangleAlert, HelpCircle } from 'lucide-react';
import React from 'react';

export const isHaram = (status: ProductStatus): boolean => {
  return status === ProductStatus.HARAM;
};

export const isHalal = (status: ProductStatus): boolean => {
  return status === ProductStatus.HALAL;
};

export const needsAttention = (status: ProductStatus): boolean => {
  return [ProductStatus.WARNING, ProductStatus.NEEDS_INFO].includes(status);
};

export const getStatusTranslationKey = (status: ProductStatus): string => {
  const translationMap = {
    [ProductStatus.HALAL]: "halal",
    [ProductStatus.HARAM]: "haram",
    [ProductStatus.WARNING]: "warning",
    [ProductStatus.NEEDS_INFO]: "needsInfo",
    [ProductStatus.UNKNOWN]: "unknown"
  };
  return translationMap[status];
};

export const getStatusIcon = (status: ProductStatus, size: number = 24): React.ReactElement => {
  switch (status) {
    case ProductStatus.HALAL:
      return <CircleCheck size={size} strokeWidth={1.5} />;
    case ProductStatus.HARAM:
      return <CircleX size={size} strokeWidth={1.5} />;
    case ProductStatus.WARNING:
      return <TriangleAlert size={size} strokeWidth={1.5} />;
    case ProductStatus.NEEDS_INFO:
      return <HelpCircle size={size} strokeWidth={1.5} />;
    default:
      return <HelpCircle size={size} strokeWidth={1.5} />;
  }
};

export const getStatusClassName = (status: ProductStatus, styles: any): string => {
  const classMap = {
    [ProductStatus.HALAL]: styles.halal,
    [ProductStatus.HARAM]: styles.haram,
    [ProductStatus.WARNING]: styles.warning,
    [ProductStatus.NEEDS_INFO]: styles.needsInfo,
    [ProductStatus.UNKNOWN]: styles.unknown
  };
  return classMap[status] || styles.unknown;
};