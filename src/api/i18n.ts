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
      you: "You",

      // Months
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December",

      // History Empty
      waiting: "Waiting for Your First Question",
      haventAskedQuestions:
        "  You haven’t asked any questions Fyet. Start asking to see your past answers here.",
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

      //Modal Language
      languageModal: "Language",
      selectLanguages: "Select your preferred language for the app.",
      english: "English",
      arabic: "Arabic",

      //Modal Theme
      setYourPreferred: "Set your preferred appearance mode.",
      chooseTheme: "Choose Theme",

      light: "Light",
      dark: "Dark",
      system: "System",

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
      noChaptersFound: "No chapters found for",
      loadingChapters: "Loading chapters...",
      ayahs: "Ayahs",

      //Ayahs
      loadPrevious: "Load Previous",
      loadMore: "Load More",

      //Translation and other
      chooseTranslation: "Choose Translation",
      selectPreferred:
        "Select your preferred translation of the Quran for better understanding.",
      makkah: "Makkah",
      madinah: "Madinah",

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
      noPrayersAvailable: "No prayers available",

      fajr: "Fajr",
      sunrise: "Sunrise",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
      witr: "Witr",
      tahajjud: "Tahajjud",
      duha: "Duha",
      tarawih: "Tarawih",

      // Prayer descriptions
      fajrDescription:
        "The Fajr prayer is the first of the five daily prayers performed by practicing Muslims. It is performed before sunrise and consists of 2 rak'ahs.",
      dhuhrDescription:
        "The Dhuhr prayer is the second prayer of the day and is offered at noon. It consists of 4 rak'ahs and is performed after the sun passes its zenith.",
      asrDescription:
        "The Asr prayer is the afternoon prayer and consists of 4 rak'ahs. It is performed in the late part of the afternoon before sunset.",
      maghribDescription:
        "The Maghrib prayer is offered immediately after sunset. It consists of 3 rak'ahs and marks the end of the day's fasting during Ramadan.",
      ishaDescription:
        "The Isha prayer is the night prayer and consists of 4 rak'ahs. It is performed after twilight has disappeared and before midnight.",
      witrDescription:
        "Witr is an optional prayer performed after the Isha prayer, consisting of an odd number of rak'ahs (usually 1, 3, 5, or 7). It is highly recommended in Islam.",
      tahajjudDescription:
        "Tahajjud is a voluntary night prayer performed after waking from sleep. It is considered one of the most virtuous optional prayers in Islam.",
      duhaDescription:
        "Duha is an optional prayer performed in the forenoon after sunrise. It consists of 2 to 8 rak'ahs and is known as the prayer of the repentant.",
      tarawihDescription:
        "Tarawih are special nightly prayers performed during Ramadan after the Isha prayer. They typically consist of 8 or 20 rak'ahs.",
      editPrayerTimes: "Edit Prayer Times",
      // Menu items
      readQuran: "Read Quran",
      openAndRead: "Open and read the Holy Quran.",
      askAboutFaith: "Ask About Your Faith",
      getAnswers: "Get answers to any question.",
      foodScanner: "Food Scanner",
      checkProduct: "Check if a product is halal by photo.",
      friends: "Friends",
      shareApp: "Share the app for bonuses!",
      settings: "Settings",
      selectSettings: "Select your preferred settings.",

      // Qibla Compass Page
      compass: "Compass",
      map: "Map",

      //History Scanner Empty
      haventChecked: "Haven’t Checked Anything",
      onceYouScan: "Once you scan a product, you’ll see your history here.",
      // Table Requests History
      history: "History",
      loading: "Loading...",
      haveRequests: "Have Requests",
      noRequests: "No Requests",
      requests: "Requests",

      // Analyzing Promis
      analyzingPromis: "Analyzing Promis",
      checkingPromis:"Checking Promis...",
      // Analyzing Ingredient
      analyzingIngredients: "Analyzing Ingredients…",
      checkingItems:
        "Checking each item to determine if the product is halal or haram.",
      timeRemaining: "Time remaining:",
      seconds: "seconds",
      // Not Scanned
      scanFailed: "Scan failed or timed out",
      analysisCouldntComplete:
        "The image analysis couldn't be completed. Please try scanning again or check your connection.",
      scanFirstProduct: "Scan first product",

      // Scanner words
      copy: "Copy",
      haram: "Haram",
      ingredients: "Ingredients",
      analysisResult: "Analysis Result",
      halal: "Halal",
      share: "Share",
      newScan: "New Scan",
      newQuestion: "New Question",
      goPremium: "Go Premium",
      premiumDescription:
        "Unlock all features with a single upgrade. Enjoy full access without limits.",
      week: " Week",
      month: " Month",
      year: " Year",
      requestsDescription:
        "Requests are used to access key features in the app. Purchase a pack to continue using the tools without interruption.",
      requestsPrem: " Requests",
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
      you: "أنت",

      // Months (الأشهر)
      january: "يناير",
      february: "فبراير",
      march: "مارس",
      april: "أبريل",
      may: "مايو",
      june: "يونيو",
      july: "يوليو",
      august: "أغسطس",
      september: "سبتمبر",
      october: "أكتوبر",
      november: "نوفمبر",
      december: "ديسمبر",
      // History Empty
      waiting: "في انتظار سؤالك الأول",
      haventAskedQuestions:
        "أنت لم تطرح أي أسئلة يا فييت. ابدأ في طلب رؤية إجاباتك السابقة هنا.",
      // Текст кнопок
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

      //Modal Language
      languageModal: "لغة",
      selectLanguages: "اختر لغتك المفضلة للتطبيق.",
      english: "إنجليزي",
      arabic: "عربي",

      //Modal Theme
      setYourPreferred: "اضبط وضع المظهر المفضل لديك.",
      chooseTheme: "اختر الموضوع",
      light: "ضوء",
      dark: "مظلم",
      system: "نظام",
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

      //Ayahs
      loadPrevious: "تحميل السابق",
      loadMore: "تحميل المزيد",
      //Translation and other
      chooseTranslation: "اختر الترجمة",
      selectPreferred: "اختر ترجمتك المفضلة للقرآن لفهم أفضل.",
      makkah: "مكة",
      madinah: "المدينة المنورة",
      ayahs: "آيات",

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

      fajr: "الفجر",
      sunrise: "الشروق",
      dhuhr: "الظهر",
      asr: "العصر",
      maghrib: "المغرب",
      isha: "العشاء",
      witr: "الوتر",
      tahajjud: "تهجد",
      duha: "ضحى",
      tarawih: "تراويح",

      // Prayer descriptions
      fajrDescription:
        "صلاة الفجر هي أول الصلوات الخمس اليومية التي يؤديها المسلمون. تؤدى قبل شروق الشمس وتتكون من ركعتين.",
      dhuhrDescription:
        "صلاة الظهر هي الصلاة الثانية في اليوم وتؤدى عند الظهر. تتكون من 4 ركعات وتؤدى بعد زوال الشمس.",
      asrDescription:
        "صلاة العصر هي صلاة العصر وتتكون من 4 ركعات. تؤدى في الجزء المتأخر من بعد الظهر قبل غروب الشمس.",
      maghribDescription:
        "صلاة المغرب تؤدى مباشرة بعد غروب الشمس. تتكون من 3 ركعات وتنتهي بها صيام اليوم في رمضان.",
      ishaDescription:
        "صلاة العشاء هي صلاة الليل وتتكون من 4 رкعات. تؤدى بعد اختفاء الشفق وقبل منتصف الليل.",
      witrDescription:
        "الوتر هي صلاة اختيارية تؤدى بعد صلاة العشاء، وتتكون من عدد فردي من الركعات (عادة 1، 3، 5، أو 7). وهي موصى بها بشدة في الإسلام.",
      tahajjudDescription:
        "التهجد هي صلاة ليلية تطوعية تؤدى بعد الاستيقاظ من النوم. تعتبر من أفضل الصلوات النافلة في الإسلام.",
      duhaDescription:
        "صلاة الضحى هي صلاة اختيارية تؤدى في الضحى بعد شروق الشمس. تتكون من 2 إلى 8 ركعات وتعرف بصلاة التائبين.",
      tarawihDescription:
        "التراويح هي صلوات ليلية خاصة تؤدى خلال رمضان بعد صلاة العشاء. تتكون عادة من 8 أو 20 ركعة.",
      editPrayerTimes: "تعديل أوقات الصلاة",
      noPrayersAvailable: "لا توجد صلوات متاحة",

      // Menu items
      readQuran: "اقرأ القرآن",
      openAndRead: "افتح واقرأ القرآن الكريم.",
      askAboutFaith: "اسأل عن إيمانك",
      getAnswers: "احصل على إجابات لأي سؤال.",
      foodScanner: "ماسح الطعام",
      checkProduct: "تحقق مما إذا كان المنتج حلالاً بالصورة.",
      friends: "الأصدقاء",
      shareApp: "شارك التطبيق للحصول على مكافآت!",
      settings: "الإعدادات",
      selectSettings: "اختر الإعدادات المفضلة لديك.",

      // Qibla Compass Page
      compass: "البوصلة",
      map: "الخريطة",
      //History Scanner Empty
      haventChecked: "لم تحقق أي شيء",
      onceYouScan: "بمجرد قيامك بمسح المنتج ضوئيًا، سترى سجلك هنا.",
      // Table Requests History
      history: "السجل",
      loading: "جاري التحميل...",
      haveRequests: "لديك طلبات",
      noRequests: "لا توجد طلبات",
      requests: "طلبات",

      // Analyzing Promis
      analyzingPromis: "تحليل الوعود",
      checkingPromis:"التحقق من الوعود...",

      // Analyzing Ingredient
      analyzingIngredients: "جاري تحليل المكونات…",
      checkingItems:
        "جاري فحص كل عنصر لتحديد ما إذا كان المنتج حلالاً أم حراماً.",
      timeRemaining: "الوقت المتبقي:",
      seconds: "ثواني",
      // Not Scanned
      scanFailed: "فشل المسح أو انتهى الوقت",
      analysisCouldntComplete:
        "لم يكتمل تحليل الصورة. يرجى المحاولة مرة أخرى أو التحقق من اتصالك.",
      scanFirstProduct: "مسح المنتج الأول",

      // Scanner words
      copy: "نسخ",
      haram: "حرام",
      ingredients: "المكونات",
      analysisResult: "نتيجة التحليل",
      halal: "حلال",
      share: "مشاركة",
      newScan: "مسح جديد",
      newQuestion: "سؤال جديد",

      // В арабскую секцию (ar) добавьте:
      goPremium: "الترقية إلى Premium",
      premiumDescription:
        "افتح جميع الميزات بترقية واحدة. استمتع بالوصول الكامل دون حدود.",
      week: " أسبوع واحد",
      month: " شهر واحد",
      year: " سنة واحدة",
      requestsDescription:
        "الطلبات تُستخدم للوصول إلى الميزات الرئيسية في التطبيق. اشترِ حزمة لمواصلة استخدام الأدوات دون انقطاع.",
      requestsPrem: " طلبات",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
