import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./ChooseTranslation.module.css";
import {
  useSurahListStore,
  mockVariants,
} from "../../../hooks/useSurahListStore";
import { Check } from "lucide-react";
import { t } from "i18next";
export const ChooseTranslation: React.FC = () => {
  const { variants, selectedVariant, setSelectedVariant } = useSurahListStore();
  return (
    <PageWrapper>
      <div className={styles.container}>
        <div className={styles.text}>
          <div className={styles.title}>{t("chooseTranslation")}</div>
          <div className={styles.deskription}>{t("selectPreferred")}</div>
        </div>
        <div className={styles.blockVariant}>
          {mockVariants.map((variant) => (
            <div
              className={`${styles.itemVariant} ${
                selectedVariant?.id == variant.id && styles.selectedVariant
              }`}
              onClick={() => setSelectedVariant(variant)}
            >
              {variant.name}
              {selectedVariant?.id == variant.id && <Check size={20} />}
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};
