export const EUR = ["eur", "euro", "євро", "євр", "еуро", "евра"];
export const USD = ["usd", "us", "юсд", "доллар", "долар"];
export const UAH = ["uah", "юах", "грн", "гривен", "гривн"];
export const CAD = ["cad", "кад"];
export const CZK = ["czk", "цзк", "крона", "крон", "крон"];
export const BGN = ["bgn", "лев", "лева", "lev", "левы"];

export const currencyList = ([] as string[]).concat(EUR, USD, UAH, CAD, CZK, BGN).map(c => c.toUpperCase());
export const regex = new RegExp(`([\\d.]+)\\s*(${currencyList.join("|")})`, 'gi'); 