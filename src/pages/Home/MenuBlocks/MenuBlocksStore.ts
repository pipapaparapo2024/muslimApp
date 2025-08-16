import Quaran from "../../../assets/icons/quaran1.svg";
import apple from "../../../assets/icons/Applee.svg";
import church from "../../../assets/icons/Churchh.svg";
import muslim from "../../../assets/icons/islam.svg";
import settings from "../../../assets/icons/setting.svg";

export const menuItems= [
  {
    id: "quran",
    icon: Quaran,
    title: "Read Quran",
    description: "Open and read the Holy Quran.",
    path: "/quran",
  },
  {
    id: "qna",
    icon: church,
    title: "Ask About  Your Faith",
    description: "Get answers to any question.",
    path: "/qna",
  },
  {
    id: "scanner",
    icon: apple,
    title: "Food Scanner",
    description: "Check if a product is halal by photo.",
    path: "/scanner",
  },
  {
    id: "friends",
    icon: muslim,
    title: "Friends",
    description: "Share the app for bonuses!",
    path: "/welcome-friends", // Будет определяться динамически в компоненте
  },
  {
    id: "settings",
    icon: settings,
    title: "Settings",
    description: "Select your preferred settings.",
    path: "/settings", // Будет определяться динамически в компоненте
  },
];
