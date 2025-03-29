import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { regex } from "./constants.ts";

Deno.test("should match simple amount and currency", () => {
  const message = "20 EUR";
  const match = message.match(regex);
  assertExists(match);
  assertEquals(match?.[1], "20");
  assertEquals(match?.[2].toUpperCase(), "EUR");
});

Deno.test("should match amount and currency with spaces", () => {
  const message = " 20 EUR ";
  const match = message.match(regex);
  assertExists(match);
  assertEquals(match?.[1], "20");
  assertEquals(match?.[2].toUpperCase(), "EUR");
});

Deno.test("should match amount and currency without spaces", () => {
  const message = "20EUR";
  const match = message.match(regex);
  assertExists(match);
  assertEquals(match?.[1], "20");
  assertEquals(match?.[2].toUpperCase(), "EUR");
});

Deno.test("should match with decimal amount", () => {
  const message = "20.5 EUR";
  const match = message.match(regex);
  assertExists(match);
  assertEquals(match?.[1], "20.5");
  assertEquals(match?.[2].toUpperCase(), "EUR");
});

Deno.test("should match with Cyrillic currency", () => {
  const message = "20 грн";
  const match = message.match(regex);
  assertExists(match);
  assertEquals(match?.[1], "20");
  assertEquals(match?.[2].toUpperCase(), "ГРН");
});

Deno.test("should match case insensitive", () => {
  const message = "20 eur";
  const match = message.match(regex);
  assertExists(match);
  assertEquals(match?.[1], "20");
  assertEquals(match?.[2].toUpperCase(), "EUR");
});

Deno.test("should match when part of a sentence", () => {
  const message = "I bought 10 figs for 20 eur";
  const match = message.match(regex);
  assertEquals({
    match: match?.[0],
    amount: match?.[1],
    currency: match?.[2],
  }, {
    match: "20 eur",
    amount: "20",
    currency: "eur",
  });
});

Deno.test("should not match invalid currency", () => {
  const message = "20 XYZ";
  const match = message.match(regex);
  assertEquals(match, null);
});

Deno.test("should not match invalid amount", () => {
  const message = "abc EUR";
  const match = message.match(regex);
  assertEquals(match, null);
}); 