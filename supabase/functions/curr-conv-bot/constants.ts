export const EUR = ["eur", "euro", "євро", "євр", "еуро", "евра", "евро"];
export const USD = ["usd", "us", "юсд", "доллар", "долар", "долларов", "доллара", "доларів", "долларів"];
export const UAH = ["uah", "юах", "грн", "гривен", "гривн", "гривень", "гривні"];
export const CAD = ["cad", "кад"];
export const CZK = ["czk", "цзк", "крона", "крон", "крони"];
export const BGN = ["bgn", "лев", "лева", "lev", "левы", "левів", "левов"];
export const GBP = ["gbp", "pound", "pounds", "фунт", "фунтов", "фунти", "фунтів", "£"];

export const currencyList = ([] as string[]).concat(EUR, USD, UAH, CAD, CZK, BGN, GBP).map(c => c.toUpperCase());
export const regex = new RegExp(`(?<!\\d\\s)(\\d{1,3}(?:[\\s,]\\d{3})*(?:\\.\\d+)?)\\s*(${currencyList.join("|")})(?![a-zA-Zа-яА-ЯіїєґІЇЄҐ])`, 'gi'); 