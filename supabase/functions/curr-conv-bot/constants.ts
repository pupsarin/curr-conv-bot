export const EUR = ["eur", "euro", "євро", "євр", "еуро"];
export const USD = ["usd", "us", "юсд"];
export const UAH = ["uah", "юах", "грн", "гривень"];
export const CAD = ["cad", "кад"];
export const CZK = ["czk", "цзк"];
export const BGN = ["bgn", "лев", "лева", "lev"];

export const currencyList = ([] as string[]).concat(EUR, USD, UAH, CAD, CZK, BGN).map(c => c.toUpperCase());
export const regex = new RegExp(`([\\d.]+)\\s*(${currencyList.join("|")})`, 'i'); 