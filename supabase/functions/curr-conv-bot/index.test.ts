import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { regex } from "./constants.ts";

Deno.test("should match basic currency format", () => {
  const message = "20 EUR";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "20 EUR");
});

Deno.test("should match currency without space", () => {
  const message = "20EUR";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "20EUR");
});

Deno.test("should match currency in sentence", () => {
  const message = "I bought 10 figs for 20 eur";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "20 eur");
});

Deno.test("should match Cyrillic currency", () => {
  const message = "20 грн";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "20 грн");
});

Deno.test("should find first valid currency match", () => {
  const message = "4600g за 120 cad";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  
  assertEquals(matches!.length, 1);
  assertEquals(matches![0], "120 cad");
  
  let processedMatch: string | null = null;
  for (const match of matches!) {
    const currency = match.replace(/[0-9.\s]/g, '').toUpperCase();
    
    if (currency === "CAD") {
      processedMatch = match;
      break;
    }
  }
  
  assertExists(processedMatch, "Should process the first valid match");
  assertEquals(processedMatch, "120 cad");
});

Deno.test("should not match partial currency codes", () => {
  const message = "100grams 120 cad";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  
  assertEquals(matches!.length, 1);
  assertEquals(matches![0], "120 cad");
});

Deno.test("should match currency variations", () => {
  const testCases = [
    { message: "20 гривен", expected: "20 гривен" },
    { message: "20 доллар", expected: "20 доллар" },
    { message: "20 долар", expected: "20 долар" },
    { message: "20 евра", expected: "20 евра" },
    { message: "20 крон", expected: "20 крон" },
    { message: "20 лев", expected: "20 лев" }
  ];

  for (const { message, expected } of testCases) {
    const matches = message.match(regex);
    assertExists(matches, `Should find matches for ${message}`);
    assertEquals(matches![0], expected);
  }
});

Deno.test("should match decimal amounts", () => {
  const testCases = [
    { message: "20.5 EUR", expected: "20.5 EUR" },
    { message: "100.99 usd", expected: "100.99 usd" },
    { message: "0.5 грн", expected: "0.5 грн" },
  ];

  for (const { message, expected } of testCases) {
    const matches = message.match(regex);
    assertExists(matches, `Should find matches for ${message}`);
    assertEquals(matches![0], expected);
  }
});

Deno.test("should not match period without digits", () => {
  const testCases = [
    ". EUR",
    ".EUR",
    ".eur",
    ". євро",
  ];

  for (const message of testCases) {
    const matches = message.match(regex);
    assertEquals(matches, null, `Should not match "${message}"`);
  }
});

Deno.test("should not match period at end of sentence before currency-like word", () => {
  const message = "подорожей.\n\nЄврокомісія готує";
  const matches = message.match(regex);
  assertEquals(matches, null, "Should not match period before Єврокомісія");
});

Deno.test("should not match currency followed by Ukrainian letters", () => {
  const testCases = [
    "10 європейський",
    "50 євроінтеграція",
    "20 eurozone",
  ];

  for (const message of testCases) {
    const matches = message.match(regex);
    assertEquals(matches, null, `Should not match currency in "${message}"`);
  }
});

Deno.test("should match space-separated thousands", () => {
  const testCases = [
    { message: "100 000 долларов", expected: "100 000 долларов" },
    { message: "1 000 EUR", expected: "1 000 EUR" },
    { message: "10 000 000 грн", expected: "10 000 000 грн" },
  ];

  for (const { message, expected } of testCases) {
    const matches = message.match(regex);
    assertExists(matches, `Should find matches for ${message}`);
    assertEquals(matches![0], expected);
  }
});

Deno.test("should not match partial number from space-separated thousands", () => {
  const message = "от 100 000 долларов";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "100 000 долларов");
  assertEquals(matches!.length, 1, "Should only match once, not '000 долларов'");
});

Deno.test("should match GBP variations", () => {
  const testCases = [
    { message: "20 GBP", expected: "20 GBP" },
    { message: "50 pounds", expected: "50 pounds" },
    { message: "100 фунт", expected: "100 фунт" },
    { message: "25 £", expected: "25 £" },
  ];

  for (const { message, expected } of testCases) {
    const matches = message.match(regex);
    assertExists(matches, `Should find matches for ${message}`);
    assertEquals(matches![0], expected);
  }
});
