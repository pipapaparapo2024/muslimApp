// import React, { useEffect, useState } from "react";
// import styles from "./SettingPrayerTimes.module.css";
// import { usePrayerApiStore } from "../../../../hooks/usePrayerApiStore";
// import { t } from "i18next";
// import { PageWrapper } from "../../../../shared/PageWrapper";
// import { ModalPrayer } from "../../../../components/modals/modalPrayer/ModalPrayer";
// import { Info } from "lucide-react";

// export const SettingPrayerTimes: React.FC = () => {
//   const {
//     prayerSetting,
//     isLoading,
//     error,
//     togglePrayerSelection,
//     togglePrayerNotification,
//     setAllPrayersSelected,
//     setAllNotifications,
//     fetchPrayerSettings,
//   } = usePrayerApiStore();

//   useEffect(() => {
//     const loadSettings = async () => {
//       await fetchPrayerSettings();
//     };

//     loadSettings();
//   }, [fetchPrayerSettings]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedPrayer, setSelectedPrayer] = useState<any>(null);

//   const handleSelectAll = () => {
//     setAllPrayersSelected(true);
//   };

//   const handleDeselectAll = () => {
//     setAllPrayersSelected(false);
//   };

//   const handleEnableAllNotifications = () => {
//     setAllNotifications(true);
//   };

//   const handleDisableAllNotifications = () => {
//     setAllNotifications(false);
//   };

//   const handleInfoClick = (prayer: any) => {
//     setSelectedPrayer(prayer);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedPrayer(null);
//   };

//   const allPrayersEnabled = prayerSetting.every((prayer) => prayer.hasSelected);
//   const allNotificationsEnabled = prayerSetting
//     .filter((prayer) => prayer.hasSelected)
//     .every((prayer) => prayer.hasTelegramNotification);

//   const handleToggleAllPrayers = () => {
//     if (allPrayersEnabled) {
//       handleDeselectAll();
//     } else {
//       handleSelectAll();
//     }
//   };

//   const handleToggleAllNotifications = () => {
//     if (allNotificationsEnabled) {
//       handleDisableAllNotifications();
//     } else {
//       handleEnableAllNotifications();
//     }
//   };

//   if (error) {
//     return (
//       <div className={styles.settingsContainer}>
//         <div className={styles.error}>
//           {t("errorLoadingSettings")}: {error}
//         </div>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className={styles.settingsContainer}>
//         <div className={styles.loading}>{t("loadingSettings")}</div>
//       </div>
//     );
//   }

//   return (
//     <PageWrapper showBackButton>
//       <div>
//         <h1 className={styles.title}>{t("prayerTimes")}</h1>
//         <p className={styles.subtitle}>{t("choosePrayers")}</p>

//         {/* Глобальные переключатели */}
//         <div className={styles.globalControls}>
//           <div className={styles.toggleGroup}>
//             <label className={styles.toggleItem}>
//               <span className={styles.showMain}>{t("showAllPrayerTimes")}</span>
//               <input
//                 type="checkbox"
//                 checked={allPrayersEnabled}
//                 onChange={handleToggleAllPrayers}
//                 className={styles.toggleInput}
//               />
//               <span className={styles.toggleSlider}></span>
//             </label>

//             <label className={styles.toggleItem}>
//               <span>{t("getAllTelegramNotifications")}</span>
//               <input
//                 type="checkbox"
//                 checked={allNotificationsEnabled}
//                 onChange={handleToggleAllNotifications}
//                 className={styles.toggleInput}
//                 disabled={!allPrayersEnabled}
//               />
//               <span className={styles.toggleSlider}></span>
//             </label>
//           </div>
//         </div>

//         <div className={styles.prayerList}>
//           {prayerSetting.map((prayer) => (
//             <div key={prayer.id} className={styles.prayerItem}>
//               <div className={styles.prayerHeader}>
//                 <div className={styles.prayerName}>{t(prayer.name)}</div>
//                 <div className={styles.headerIconInfo}>
//                   <Info
//                     size={18}
//                     className={styles.infoButton}
//                     onClick={() => handleInfoClick(prayer)}
//                   />
//                 </div>
//               </div>

//               <div className={styles.toggleGroup}>
//                 <label className={styles.toggleItem}>
//                   <span className={styles.showMain}>
//                     {t("showOnMainScreen")}
//                   </span>
//                   <input
//                     type="checkbox"
//                     checked={prayer.hasSelected}
//                     onChange={() => togglePrayerSelection(prayer.id)}
//                     className={styles.toggleInput}
//                   />
//                   <span className={styles.toggleSlider}></span>
//                 </label>

//                 <label className={styles.toggleItem}>
//                   <span>{t("getTelegramNotifications")}</span>
//                   <input
//                     type="checkbox"
//                     checked={prayer.hasTelegramNotification}
//                     onChange={() => togglePrayerNotification(prayer.id)}
//                     className={styles.toggleInput}
//                     disabled={!prayer.hasSelected}
//                   />
//                   <span className={styles.toggleSlider}></span>
//                 </label>
//               </div>
//             </div>
//           ))}
//         </div>

//         {selectedPrayer && (
//           <ModalPrayer
//             isOpen={isModalOpen}
//             onRequestClose={handleCloseModal}
//             prayer={selectedPrayer}
//           />
//         )}
//       </div>
//     </PageWrapper>
//   );
// };

export const SettingPrayerTimes:React.FC=()=>{
  return<>SettingPrayerTimes</>
}
