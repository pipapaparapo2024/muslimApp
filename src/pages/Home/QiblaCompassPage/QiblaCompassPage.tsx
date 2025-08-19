import React, { useEffect } from "react";
import { QiblaMap } from "../QiblaCompass/QiblaMap";
import { QiblaCompass } from "../QiblaCompass/QiblaCompass";
import styles from "./QiblaCompassPage.module.css";
import { PageWrapper } from "../../../shared/PageWrapper";
import { useQiblaCompassPageStore } from "./QiblaCompassPageStore";
import { Compass, Map } from "lucide-react";
import { useLocation } from "react-router-dom";

export const QiblaCompassPage: React.FC = () => {
  const location = useLocation();
  const { activeTab, setActiveTab } = useQiblaCompassPageStore();
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state, setActiveTab]);
  return (
    <PageWrapper showBackButton>
      <div>
        <div className={styles.tabsWideRow}>
          <button
            className={`${styles.tabWide} ${
              activeTab === "compass" ? styles.tabWideActive : ""
            }`}
            onClick={() => setActiveTab("compass")}
          >
            <div>
              <Compass strokeWidth={1.5} /> Compass
            </div>
          </button>
          <button
            className={`${styles.tabWide} ${
              activeTab === "map" ? styles.tabWideActive : ""
            }`}
            onClick={() => setActiveTab("map")}
          >
            <Map strokeWidth={1.5} />
            Map
          </button>
        </div>
        <div className={styles.tabContent}>
          {activeTab === "compass" ? (
            <div className={styles.bigCompass}>
              <QiblaCompass showAngle={true} size={300} />
            </div>
          ) : (
            <div>
              <QiblaMap fullscreen={true} />
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
