import React, { useEffect, useState } from "react";
import { PageWrapper } from "../../../../shared/PageWrapper";
import styles from "./Region.module.css";
import { Check, Search } from "lucide-react";
import { useRegionStore } from "./RegionStore";
import { useGeoStore } from "../../../Home/GeoStore";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";

export const Region: React.FC = () => {
  const { regions, isLoading, fetchRegions, selectedRegion, setSelectedRegion } = useRegionStore();
  const { city: currentCity, country: currentCountry, timeZone: currentTimeZone } = useGeoStore();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  // Фильтрация регионов по городу или стране
  const filteredRegions = regions.filter((region) =>
    `${region.city} ${region.country}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelected = (region: any) => {
    if (selectedRegion) return selectedRegion.id === region.id;
    return (
      region.city === currentCity &&
      region.country === currentCountry &&
      region.timeZone === currentTimeZone
    );
  };

  if (isLoading) {
    return (
      <PageWrapper showBackButton>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton>
      <div className={styles.container}>
        <div className={styles.blockChoose}>
          <div className={styles.title}>Choose Region</div>
          <div className={styles.description}>
            Choose your location to personalize content.
          </div>
          <div className={styles.searchWrapper}>
            <Search strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder="Search Region"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.regionsList}>
          {filteredRegions.length === 0 ? (
            <div className={styles.regionItem}>No regions found</div>
          ) : (
            filteredRegions.map((region) => (
              <div
                key={region.id}
                className={`${styles.regionItem} ${isSelected(region) ? styles.selected : ""}`}
                onClick={() => setSelectedRegion(region)}
              >
                <div className={styles.regionText}>
                  {region.city}, {region.country}
                </div>
                {isSelected(region) && <Check size={20} />}
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
};