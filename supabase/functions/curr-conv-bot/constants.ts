export const SUPPORTED_CURRENCIES = ["USD", "CZK", "UAH", "CAD", "EUR", "GBP"];

export const CURRENCY_ALIASES: Record<string, readonly string[]> = {
  EUR: ["eur", "euro", "євро", "євр", "еуро", "евра", "евро"],
  USD: ["usd", "us", "юсд", "доллар", "долар", "долларов", "доллара", "доларів", "долларів"],
  UAH: ["uah", "юах", "грн", "гривен", "гривн", "гривень", "гривні"],
  CAD: ["cad", "кад"],
  CZK: ["czk", "цзк", "крона", "крон", "крони"],
  GBP: ["gbp", "pound", "pounds", "фунт", "фунтов", "фунти", "фунтів", "£"],
};

export const CURRENCY_MAP: Record<string, string> = Object.entries(CURRENCY_ALIASES).reduce(
  (acc, [currency, aliases]) => {
    for (const alias of aliases) {
      acc[alias.toUpperCase()] = currency;
    }
    return acc;
  },
  {} as Record<string, string>
);

const currencyList = Object.values(CURRENCY_ALIASES).flat().map(c => c.toUpperCase());
export const regex = new RegExp(`(?<!\\d\\s)(\\d{1,3}(?:[\\s,]\\d{3})*(?:\\.\\d+)?)\\s*(${currencyList.join("|")})(?![a-zA-Zа-яА-ЯіїєґІЇЄҐ])`, 'gi');

export const TRANSLATIONS: Record<string, { converting: string }> = {
  en: { converting: "Converting" },
  uk: { converting: "Конвертую" },
  ru: { converting: "Конвертую" },
  cs: { converting: "Převádím" },
  de: { converting: "Umrechnung" },
  fr: { converting: "Conversion" },
  es: { converting: "Convirtiendo" },
  pl: { converting: "Konwertuję" },
};

 