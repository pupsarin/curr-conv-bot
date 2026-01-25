import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.30.0/mod.ts";
import { Context } from "https://deno.land/x/grammy@v1.30.0/types.deno.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { regex, SUPPORTED_CURRENCIES, CURRENCY_MAP } from "./constants.ts";
import { getTranslation } from "./utils.ts";

const RATES_TABLE = "currency_rates";

const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY") || "";
const tgToken = Deno.env.get("TG_TOKEN") || "";
const publicSecret = Deno.env.get("SECRET") || "";
const fxRatesKey = Deno.env.get("FX_RATES_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  CZK: "🇨🇿",
  UAH: "🇺🇦",
  CAD: "🇨🇦",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
};

const bot = new Bot(tgToken);

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


const fetchRates = async (base) => {
  try {
    const currencies = SUPPORTED_CURRENCIES
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

  const t = getTranslation(ctx.from?.language_code);

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

      const entries = Object.entries(rates)
        .filter(([curr]) => SUPPORTED_CURRENCIES.includes(curr))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([curr, rate]) => {
        const value = (amount * rate).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
        const flag = CURRENCY_FLAGS[curr] || "";
        return `${flag} ${value} ${curr}`;
      });

      const rows: string[] = [];
      for (let i = 0; i < entries.length; i += 2) {
        if (entries[i + 1]) {
          rows.push(`${entries[i]}  |  ${entries[i + 1]}`);
        } else {
          rows.push(entries[i]);
        }
      }

      ctx.reply(`${t.converting} ${match}:\n${rows.join("\n")}`);
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
