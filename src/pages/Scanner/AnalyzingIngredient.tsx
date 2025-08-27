import { PageWrapper } from "../../shared/PageWrapper";
import styles from "./AnalyzingIngredient.module.css";
import analyz from '../../assets/image/analyz.png'
export const AnalyzingIngredient: React.FC = () => {
  return (
    <PageWrapper>
      <div className={styles.container}>
        <div className={styles.text}>
          <div className={styles.title}>Analyzing Ingredients…</div>
          <div className={styles.desk}>
            Checking each item to determine if the product is halal or haram.
          </div>
          <img src={analyz}/>
        </div>
      </div>
    </PageWrapper>
  );
};
