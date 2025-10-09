import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./ChooseTranslation.module.css";
import { useSurahListStore } from "../../../hooks/useSurahListStore";
import { Check } from "lucide-react";
// import { useEffect } from "react";
import { useTranslationsStore } from "../../../hooks/useTranslations";

export const ChooseTranslation: React.FC = () => {
  const {
    selectedVariant,
    setSelectedVariant,
    // fetchVariants,
    variants,
    loading,
  } = useSurahListStore();
  const { translations } = useTranslationsStore();
  // useEffect(() => {
  //   fetchVariants();
  // }, [fetchVariants]);

  return (
    <PageWrapper showBackButton={true} navigateTo="/quran">
      <div className={styles.container}>
        <div className={styles.text}>
          <div className={styles.title}> {translations?.chooseTranslation}</div>
          <div className={styles.deskription}>
            {translations?.selectPreferred}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}> {translations?.loading}...</div>
        ) : (
          <div className={styles.blockVariant}>
            {variants.length > 0 ? (
              variants.map((variant) => (
                <div
                  key={variant.id}
                  className={`${styles.itemVariant} ${
                    selectedVariant?.id === variant.id
                      ? styles.selectedVariant
                      : ""
                  }`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  {variant.name}
                  {selectedVariant?.id === variant.id && <Check size={20} />}
                </div>
              ))
            ) : (
              <div className={styles.noVariants}>
                {translations?.noTranslationsAvailable}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
