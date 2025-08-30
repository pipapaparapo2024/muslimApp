// i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Общие фразы
      appSettings: "App Settings",
      region: "Region",
      language: "Language",
      dateTime: "Date & Time",
      prayerTimes: "Prayer Times",
      theme: "Theme",
      privacyPolicy: "Privacy Policy",
      termsOfUse: "Terms Of Use",
      contactUs: "Contact Us",
      importantLinks: "Important Links",

      // Текст кнопок
      buyPremium: "Buy Premium",
      premiumActive: "Premium Active",
      daysLeft: "Days Left",
      hoursLeft: "Hours Left",
      buyRequests: "Buy Requests",
      askQuestion: "Ask Question",
      asking: "Asking...",
      scanPicture: "Scan Picture",

      // Prayer Times
      calculatingPrayerTimes: "Calculating prayer times...",
      viewTodaysSalah: "View today's Salah times and upcoming prayers.",
      in: "In",
      minutes: "min",

      // Qibla
      faceTheKaaba: "Face the Kaaba",
      useMapForSalah: "Use the map to align yourself correctly for Salah.",

      // QnA
      needGuidance: "Need Guidance?",
      getClearAnswers:
        "Get clear, concise answers to what matters most. Ask and we'll respond right here.",
      yourQuestion: "Your Question",

      // Scanner
      instantHalalCheck: "Instant Halal Check",
      takePhotoCheck:
        "Take a photo of the product's ingredients to check if it's halal or haram. You'll get a quick result with a short explanation.",
      informationalOnly: "The result is for informational purposes only.",

      // Welcome screen
      prayerReminders: "Prayer Reminders",
      stayOnTrack:
        "Stay on track with timely reminders for every prayer throughout the day.",
      readTheQuran: "Read the Quran",
      accessQuran:
        "Access the full Quran anytime, anywhere. Beautifully organized and easy to navigate.",
      scanYourFood: "Scan Your Food",
      checkHalal:
        "Quickly check if a product is halal or haram by scanning it — clear answers in seconds.",
      trustedAnswers: "Get Trusted Religious Answers",
      receiveAnswers:
        "Receive accurate, reliable responses to help you confidently understand your faith.",
      next: "Next",
      start: "Start",
      authError: "Authentication Error",
      tryAgain: "Try Again",

      // Friends
      earnRewards: "🎁 Earn Rewards by Sharing",
      inviteFriendsDesc:
        "Invite friends and get exclusive bonuses — the more you share, the more you gain.",
      inviteFriends: "Invite Friends",
      getFreeRequests: "Get Free Requests",
      freeRequestsDesc:
        "Get free requests when your invited friends engage with the app.",
      unlockPremium: "Unlock Premium for Free",
      unlockPremiumDesc:
        "Access Premium for free when your invited friends complete a purchase.",
      yourInvitations: "Your Invitations",
      noFriendsYet: "None of your invited friends have joined so far.",
      accepted: "Accepted",
      purchased: "Purchased",
      getReward: "Get Reward",

      // Settings дополнительные
      selected: "Selected",

      // Quran
      holyQuran: "Holy Quran",
      discoverChapters: "Discover the Quran's 114 chapters",
      searchChapters: "Search Chapters",
      translation: "Translation:",
      noChaptersFound: 'No chapters found for',
      loadingChapters: "Loading chapters...",
      ayahs: "Ayahs",

      // Date Time Settings
      timeFormat: "Time Format",
      hourTime: "24-Hour Time",
      setAutomatically: "Set Automatically",
      timeZone: "Time zone",
      dateFormat: "Date Format",

      // Region
      chooseRegion: "Choose Region",
      chooseLocation: "Choose your location to personalize content.",
      searchRegion: "Search Region",
      noRegionsFound: "No regions found",

      // Prayer Times Settings
      choosePrayers: "Choose the prayers you want to monitor.",
      showAllPrayerTimes: "Show All Prayer Times",
      getAllTelegramNotifications: "Get All Telegram Notifications",
      showOnMainScreen: "Show On Main Screen",
      getTelegramNotifications: "Get Telegram Notifications",
    },
  },
  ar: {
    translation: {
      // Общие фразы
      appSettings: "إعدادات التطبيق",
      region: "المنطقة",
      language: "اللغة",
      dateTime: "التاريخ والوقت",
      prayerTimes: "أوقات الصلاة",
      theme: "المظهر",
      privacyPolicy: "سياسة الخصوصية",
      termsOfUse: "شروط الاستخدام",
      contactUs: "اتصل بنا",
      importantLinks: "روابط مهمة",

      // Текст кнопок
      buyPremium: "شراء Premium",
      premiumActive: "Premium مفعل",
      daysLeft: "يوم متبقي",
      hoursLeft: "ساعة متبقية",
      buyRequests: "شراء الطلبات",
      askQuestion: "اطرح سؤالاً",
      asking: "جاري السؤال...",
      scanPicture: "مسح الصورة",

      // Prayer Times
      calculatingPrayerTimes: "جاري حساب أوقات الصلاة...",
      viewTodaysSalah: "عرض أوقات الصلاة اليومية والصلاة القادمة.",
      in: "في",
      minutes: "دقيقة",

      // Qibla
      faceTheKaaba: "توجه towards الكعبة",
      useMapForSalah: "استخدم الخريطة لمحاذاة نفسك بشكل صحيح للصلاة.",

      // QnA
      needGuidance: "تحتاج إلى توجيه؟",
      getClearAnswers:
        "احصل على إجابات واضحة وموجزة لما يهمك أكثر. اسأل وسنرد هنا.",
      yourQuestion: "سؤالك",

      // Scanner
      instantHalalCheck: "فحص الحلال الفوري",
      takePhotoCheck:
        "التقط صورة لمكونات المنتج للتحقق مما إذا كانت حلالاً أم حراماً. ستحصل على نتيجة سريعة مع شرح موجز.",
      informationalOnly: "النتيجة لأغراض إعلامية فقط.",

      // Welcome screen
      prayerReminders: "تذكير الصلاة",
      stayOnTrack:
        "ابق على المسار الصحيح مع تذكيرات في الوقت المناسب لكل صلاة طوال اليوم.",
      readTheQuran: "اقرأ القرآن",
      accessQuran:
        "الوصول إلى القرآن الكريم كاملاً في أي وقت وفي أي مكان. منظم بشكل جميل وسهل التنقل.",
      scanYourFood: "امسح طعامك",
      checkHalal:
        "تحقق بسرعة مما إذا كان المنتج حلالاً أم حراماً عن طريق مسحه ضوئيًا - إجابات واضحة في ثوانٍ.",
      trustedAnswers: "احصل على إجابات دينية موثوقة",
      receiveAnswers: "تلقي ردودًا دقيقة وموثوقة لمساعدتك على فهم دينك بثقة.",
      next: "التالي",
      start: "ابدأ",
      authError: "خطأ في المصادقة",
      tryAgain: "حاول مرة أخرى",
      // Friends
      earnRewards: "🎁 اربح مكافآت بالمشاركة",
      inviteFriendsDesc:
        "ادعُ أصدقاءك واحصل على مكافآت حصرية — كلما شاركت أكثر، كلما ربحت أكثر.",
      inviteFriends: "ادعُ الأصدقاء",
      getFreeRequests: "احصل على طلبات مجانية",
      freeRequestsDesc:
        "احصل على طلبات مجانية عندما يشارك أصدقاؤك المدعوون في التطبيق.",
      unlockPremium: "افتح Premium مجاناً",
      unlockPremiumDesc:
        "احصل على Premium مجاناً عندما يكمل أصدقاؤك المدعوون عملية شراء.",
      yourInvitations: "دعواتك",
      noFriendsYet: "لم ينضم أي من أصدقائك المدعوين حتى الآن.",
      accepted: "مقبول",
      purchased: "تم الشراء",
      getReward: "احصل على المكافأة",

      // Settings дополнительные
      selected: "محدد",

      // Quran
      holyQuran: "القرآن الكريم",
      discoverChapters: "اكتشف فصول القرآن الـ 114",
      searchChapters: "ابحث في الفصول",
      translation: "الترجمة:",
      noChaptersFound: "لم يتم العثور على فصول لـ",
      loadingChapters: "جاري تحميل الفصول...",
      ayahs: "{{count}} آية",

      // Date Time Settings
      timeFormat: "تنسيق الوقت",
      hourTime: "وقت 24 ساعة",
      setAutomatically: "ضبط تلقائياً",
      timeZone: "المنطقة الزمنية",
      dateFormat: "تنسيق التاريخ",

      // Region
      chooseRegion: "اختر المنطقة",
      chooseLocation: "اختر موقعك لتخصيص المحتوى.",
      searchRegion: "ابحث في المنطقة",
      noRegionsFound: "لم يتم العثور على مناطق",

      // Prayer Times Settings
      choosePrayers: "اختر الصلوات التي تريد مراقبتها.",
      showAllPrayerTimes: "عرض جميع أوقات الصلاة",
      getAllTelegramNotifications: "الحصول على جميع إشعارات Telegram",
      showOnMainScreen: "عرض على الشاشة الرئيسية",
      getTelegramNotifications: "الحصول على إشعارات Telegram",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
});

export default i18n;
