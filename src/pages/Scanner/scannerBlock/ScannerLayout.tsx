import React from "react";
import { PageWrapper } from "../../../shared/PageWrapper";
import { TableRequestsHistory } from "../../../components/TableRequestsHistory/TableRequestsHistory";
import styles from "../Scanner.module.css";

interface ScannerLayoutProps {
  children: React.ReactNode;
}

export const ScannerLayout: React.FC<ScannerLayoutProps> = ({ children }) => {
  return (
    <PageWrapper showBackButton>
      <div className={styles.container}>
        <div className={styles.table}>
          <TableRequestsHistory text="/scanner/historyScanner" />
        </div>
        {children}
      </div>
    </PageWrapper>
  );
};