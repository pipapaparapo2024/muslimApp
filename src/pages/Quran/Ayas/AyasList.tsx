// import React, { useEffect, useState } from "react";
// import { useParams, useLocation } from "react-router-dom";
// import { useSurahListStore } from "../../../hooks/useSurahListStore";
// import { PageWrapper } from "../../../shared/PageWrapper";
// import styles from "./AyasList.module.css";

// export const AyahList: React.FC = () => {
//   const { surahId } = useParams<{ surahId: string }>();
//   const location = useLocation();
//   const { surah } = location.state || {};

//   const { fetchAyahs } = useSurahListStore();

//   const [ayahs, setAyahs] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const loadAyahs = async () => {
//       if (!surahId) {
//         setError("Surah ID is missing");
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         const ayahsData = await fetchAyahs(surahId);
//         setAyahs(ayahsData);
//         setLoading(false);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "Failed to load ayahs");
//         setLoading(false);
//       }
//     };

//     loadAyahs();
//   }, [surahId, fetchAyahs]);

//   if (error) {
//     return (
//       <PageWrapper showBackButton>
//         <div className={styles.error}>{error}</div>
//       </PageWrapper>
//     );
//   }

//   return (
//     <PageWrapper showBackButton navigateTo="/quran">
//       <div className={styles.container}>
//         <div className={styles.header}>
//           <h1>{surah?.englishName || `Surah ${surahId}`}</h1>
//           <p>{surah?.englishNameTranslation}</p>
//           <div className={styles.surahInfo}>
//             {surah?.revelationType} • {surah?.numberOfAyahs} Ayahs
//           </div>
//         </div>

//         {loading ? (
//           <div className={styles.loading}>Loading ayahs...</div>
//         ) : (
//           <div className={styles.ayahsList}>
//             {ayahs.length === 0 ? (
//               <div className={styles.noAyahs}>No ayahs found</div>
//             ) : (
//               ayahs.map((ayah) => (
//                 <div key={ayah.number} className={styles.ayahItem}>
//                   <div className={styles.ayahNumber}>{ayah.number}</div>
//                   <div className={styles.ayahText}>{ayah.text}</div>
//                 </div>
//               ))
//             )}
//           </div>
//         )}
//       </div>
//     </PageWrapper>
//   );
// };

import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  useSurahListStore,
  mockSurahs,
} from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./AyasList.module.css";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";

export const AyahList: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const location = useLocation();
  const { surah } = location.state || {};

  const { fetchAyahs } = useSurahListStore();

  const [ayahs, setAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAyahs = async () => {
      if (!surahId) {
        setError("Surah ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching ayahs for surah:", surahId);
        const ayahsData = await fetchAyahs(surahId);
        console.log("Received ayahs:", ayahsData);
        setAyahs(ayahsData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading ayahs:", err);
        setError(err instanceof Error ? err.message : "Failed to load ayahs");
        setLoading(false);
      }
    };

    loadAyahs();
  }, [surahId, fetchAyahs]);

  // if (error) {
  //   return (
  //     <PageWrapper showBackButton>
  //       <p>{error}</p>
  //     </PageWrapper>
  //   );
  // }
  if (loading)
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );

  return (
    <PageWrapper showBackButton navigateTo="/quran">
      <div className={styles.container}>{mockSurahs.map()}</div>
    </PageWrapper>
  );
};
