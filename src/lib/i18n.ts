import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import sw from "@/locales/sw.json";

const LANGUAGE_STORAGE_KEY = "agriSmartLanguage";

const getInitialLanguage = (): "en" | "sw" => {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "sw" ? "sw" : "en";
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sw: { translation: sw },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  returnNull: false,
});

export { LANGUAGE_STORAGE_KEY };
export default i18n;
