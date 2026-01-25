import { TRANSLATIONS } from "./constants.ts";

export const getTranslation = (lang: string | undefined) => {
  const langCode = lang?.split("-")[0] || "uk";
  return TRANSLATIONS[langCode] || TRANSLATIONS.uk;
};
