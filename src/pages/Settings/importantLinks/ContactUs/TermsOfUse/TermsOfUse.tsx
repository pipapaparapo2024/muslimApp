import React from "react";
import { PageWrapper } from "../../../../../shared/PageWrapper";

export const TermsOfUse: React.FC = () => {
  return (
    <PageWrapper showBackButton={true} navigateTo="/settings">
      <div>TermsOfUse Settings Page</div>
    </PageWrapper>
  );
};