import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { setUserLanguage, type SupportedLanguage } from "@/services/firestore-users";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { currentUser } = useAuth();
  const active = i18n.language === "sw" ? "sw" : "en";

  const handleChange = async (value: string) => {
    if (!value) return;
    const language = value === "sw" ? "sw" : "en";
    i18n.changeLanguage(language);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    if (currentUser?.uid) {
      try {
        await setUserLanguage(currentUser.uid, language as SupportedLanguage);
      } catch {
        // Non-blocking
      }
    }
  };

  return (
    <ToggleGroup
      type="single"
      value={active}
      onValueChange={handleChange}
      className="border border-border rounded-full px-1"
    >
      <ToggleGroupItem value="en" size="sm">
        {t("language.english")}
      </ToggleGroupItem>
      <ToggleGroupItem value="sw" size="sm">
        {t("language.swahili")}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
