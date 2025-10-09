import React from "react";
import { PageWrapper } from "../../../../shared/PageWrapper";

export const PrivacyPolicy: React.FC = () => {
  return (
    <PageWrapper showBackButton={true}  navigateTo="/settings">
      <div>PrivacyPolicy Settings Page</div>
    </PageWrapper>
  );
};