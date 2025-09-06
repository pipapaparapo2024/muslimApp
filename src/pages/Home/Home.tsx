// import React from "react";
// import styles from "./Home.module.css";
// import { PageWrapper } from "../../shared/PageWrapper";
// import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
// import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
// import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
// import { QiblaMap } from "./QiblaCompass/QiblaMap";
// import { Header } from "../../components/header/Header";
// import { t } from "i18next";
// import { useHomeLogic } from "./useHomeLogic"; 

// export const Home: React.FC = () => {
//   const {
//     city,
//     country,
//     coords,
//     isLoading,
//     error,
//     isRefreshing,
//     sensorPermission,
//     handleRefreshLocationData,
//     requestSensorPermission,
//     handleCompassClick,
//     handleMapClick,
//   } = useHomeLogic();

//   return (
//     <PageWrapper>
//       <Header
//         city={city || "Unknown city"}
//         country={country || "Unknown country"}
//       />

//       {/* === КНОПКА ЗАПРОСА ДОСТУПА К ДАТЧИКАМ (всегда под Header) === */}
//       {sensorPermission === "prompt" && (
//         <div className={styles.sensorPermissionPrompt}>
//           <div className={styles.sensorPermissionCard}>
//             <div className={styles.sensorIcon}>🧭</div>
//             <button
//               className={styles.allowSensorButton}
//               onClick={requestSensorPermission}
//             >
//               Allow
//             </button>
//           </div>
//         </div>
//       )}

//       <div className={styles.homeRoot}>
//         {/* Кнопка обновления местоположения */}
//         <div className={styles.refreshButtonContainer}>
//           <button
//             className={styles.refreshLocationButton}
//             onClick={handleRefreshLocationData}
//             disabled={isRefreshing}
//             title={t("refreshLocation")}
//           >
//             refresh
//           </button>
//         </div>

//         {isLoading && (
//           <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
//             {t("detectingLocation")}...
//           </div>
//         )}

//         {error && (
//           <div style={{ padding: "16px", textAlign: "center", color: "red" }}>
//             {error}
//           </div>
//         )}

//         <div className={styles.prayerTimesQiblaContainer}>
//           <PrayerTimes />

//           <div className={styles.qiblaBlock}>
//             <div className={styles.titleFaceKaaba}>{t("faceTheKaaba")}</div>
//             <div className={styles.diskFaceKaaba}>{t("useMapForSalah")}</div>

//             <div className={styles.qiblaBlockRow}>
//               <div onClick={handleMapClick} className={styles.mapContainer}>
//                 <QiblaMap onMapClick={handleMapClick} />
//               </div>

//               <div
//                 onClick={handleCompassClick}
//                 className={styles.compassContainer}
//               >
//                 <QiblaCompass
//                   permissionGranted={sensorPermission === "granted"}
//                   coords={coords}
//                 />
//                 {sensorPermission !== "granted" && (
//                   <div className={styles.permissionPrompt}>
//                     <p>{t("compassNeedsAccess")}</p>
//                     <button
//                       className={styles.permissionButton}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         requestSensorPermission();
//                       }}
//                     >
//                       {t("allow")}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         <MenuBlocks />
//       </div>
//     </PageWrapper>
//   );
// };


export const Home:React.FC=()=>{
  return(<>Home</>)
}