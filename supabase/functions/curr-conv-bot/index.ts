import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  Bot,
  webhookCallback,
  InlineKeyboard,
} from "https://deno.land/x/grammy@v1.30.0/mod.ts";
import { Context } from "https://deno.land/x/grammy@v1.30.0/types.deno.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { EUR, USD, UAH, CAD, CZK, BGN, GBP, regex } from "./constants.ts";

const RATES_TABLE = "currency_rates";
const SETTINGS_TABLE = "user_settings";

const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY") || "";
const tgToken = Deno.env.get("TG_TOKEN") || "";
const publicSecret = Deno.env.get("SECRET") || "";
const fxRatesKey = Deno.env.get("FX_RATES_KEY") || "";

const convertToCurrencyMap = (
  currencyName: string,
  currencyArray: string[],
) => {
  return currencyArray.reduce((acc, curr) => {
    acc[curr.toUpperCase()] = currencyName;
    return acc;
  }, {});
};

const CURRENCY_MAP = {
  ...convertToCurrencyMap("EUR", EUR),
  ...convertToCurrencyMap("USD", USD),
  ...convertToCurrencyMap("UAH", UAH),
  ...convertToCurrencyMap("CAD", CAD),
  ...convertToCurrencyMap("CZK", CZK),
  ...convertToCurrencyMap("BGN", BGN),
  ...convertToCurrencyMap("GBP", GBP),
};

const supabase = createClient(supabaseUrl, supabaseKey);

const bot = new Bot(tgToken);

bot.command("settings", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const { data: settings } = await supabase
    .from(SETTINGS_TABLE)
    .select("enabled_currencies")
    .eq("user_id", userId)
    .single();

  const enabledCurrencies = settings?.enabled_currencies || ["USD", "CZK", "UAH", "CAD", "EUR", "BGN", "GBP"];

  const keyboard = new InlineKeyboard();
  const currencies = ["USD", "CZK", "UAH", "CAD", "EUR", "BGN", "GBP"];
  
  currencies.forEach((currency, index) => {
    const isEnabled = enabledCurrencies.includes(currency);
    keyboard.text(`${isEnabled ? "✅" : "❌"} ${currency}`, `toggle_${currency}`)
      .row();
  });

  await ctx.reply("Select currencies to show in conversion results:", {
    reply_markup: keyboard,
  });
});

bot.callbackQuery(/^toggle_(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const currency = ctx.match[1];
  
  const { data: settings } = await supabase
    .from(SETTINGS_TABLE)
    .select("enabled_currencies")
    .eq("user_id", userId)
    .single();

  const enabledCurrencies = settings?.enabled_currencies || ["USD", "CZK", "UAH", "CAD", "EUR", "BGN", "GBP"];
  
  const newEnabledCurrencies = enabledCurrencies.includes(currency)
    ? enabledCurrencies.filter(c => c !== currency)
    : [...enabledCurrencies, currency];

  await supabase
    .from(SETTINGS_TABLE)
    .upsert({
      user_id: userId,
      enabled_currencies: newEnabledCurrencies,
    });

  const keyboard = new InlineKeyboard();
  const currencies = ["USD", "CZK", "UAH", "CAD", "EUR", "BGN", "GBP"];
  
  currencies.forEach((curr) => {
    const isEnabled = newEnabledCurrencies.includes(curr);
    keyboard.text(`${isEnabled ? "✅" : "❌"} ${curr}`, `toggle_${curr}`)
      .row();
  });

  await ctx.editMessageText("Select currencies to show in conversion results:", {
    reply_markup: keyboard,
  });
});

const lessThanXDaysAgo = (date, days = 1) => {
  const now = Date.now();
  const dayInMs = 1000 * 60 * 60 * 24 * days;
  const dateTime = new Date(date).getTime();

  return now - dateTime < dayInMs;
};

const getLastCurrencyUpdateDateForBase = async (base) => {
  try {
    const { data: dates } = await supabase
      .from(RATES_TABLE)
      .select("created_at", "base")
      .eq("base", base)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastDate = dates[0];

    if (lastDate) {
      return new Date(lastDate.created_at);
    } else {
      return new Date(0);
    }
  } catch (e) {
    throw new Error(`getLastCurrencyUpdateDateForBase:  ${e.message}`)
  }
};

const getCurrencyExchangeRates = async (base) => {
  try {
    const { data: allRates } = await supabase
      .from(RATES_TABLE)
      .select("rates", "base")
      .eq("base", base)
      .order("created_at", { ascending: false })
      .limit(1);

    const currentRates = allRates?.[0]?.rates;

    return currentRates;
  } catch (e) {
    throw new Error(`getCurrencyExchangeRates: ${e.message}`);
  }
};

const SEPARATORS = ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇"];

const fetchRates = async (base) => {
  try {
    const currencies = ["USD", "CZK", "UAH", "CAD", "EUR", "BGN", "GBP"]
      .filter((curr) => curr !== base)
      .join(",");
    const searchParams = new URLSearchParams({
      currencies: "PRESERVE_COMMAS",
      base: base || "EUR",
      places: 3,
    })
      .toString()
      .replace("PRESERVE_COMMAS", currencies);

    const response = await fetch(
      `https://api.fxratesapi.com/latest?${searchParams}`,
      {
        headers: { Authorization: `Bearer ${fxRatesKey}` },
      },
    );

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();

    return json;
  } catch (e) {
    throw new Error(`fetchRates: ${e.message}`);
  }
};

const fetchCurrencyExchangeRates = async (
  userRequestBase: string,
  userId: number,
) => {
  try {
    const { rates, base } = await fetchRates(userRequestBase);

    const { data, error } = await supabase
      .from(RATES_TABLE)
      .insert({ rates, base, requested_by: userId })
      .select("rates");

    if (error) {
      throw new Error(`Supabase failed to insert data: ${error.message}`);
    }

    return data.rates;
  } catch (e) {
    throw new Error(`fetchCurrencyExchangeRates: ${e.message}`);
  }
};

bot.on(":text", async (ctx: Context) => {
  const message = ctx.msg.text;
  const matches = message.match(regex);

  if (!matches) return;

  const userId = ctx.from?.id;
  if (!userId) return;

  // Get user settings
  const { data: settings } = await supabase
    .from(SETTINGS_TABLE)
    .select("enabled_currencies")
    .eq("user_id", userId)
    .single();

  const enabledCurrencies = settings?.enabled_currencies || ["USD", "CZK", "UAH", "CAD", "EUR", "BGN", "GBP"];

  for (const match of matches) {
    const amount = parseFloat(match.replace(/[^0-9.]/g, ''));
    const currency = match.replace(/[0-9.\s]/g, '').toUpperCase();
    const base = CURRENCY_MAP[currency];

    if (base) {
      const lastCurrencyUpdateDate = await getLastCurrencyUpdateDateForBase(base);
      let rates = {};
      if (lessThanXDaysAgo(lastCurrencyUpdateDate)) {
        rates = await getCurrencyExchangeRates(base);
      } else { 
        rates = await fetchCurrencyExchangeRates(base, userId);
      }

      const convertedAmount = Object.entries(rates)
        .filter(([curr]) => enabledCurrencies.includes(curr))
        .reduce(
          (acc, [curr, rate], index) => {
            acc += `${(amount * rate).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })} ${curr} ${SEPARATORS[index]} `;
            return acc;
          },
          "",
        );

      ctx.reply(`Converting ${match}:\n${convertedAmount.slice(0, -3)}`);
      break;
    }
  }
});

const useWebhook = webhookCallback(bot, "std/http");

const run = async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== publicSecret) {
      return new Response("Not allowed", { status: 405 });
    }

    return await useWebhook(req.clone());
  } catch (e) {
    return new Response(`run: ${e.message}`, { status: 500 });
  }
};

serve(run);
